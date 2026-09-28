import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  AnalyzeMealBody,
  AnalyzeMealResponse,
  GenerateMealPlanBody,
  GenerateMealPlanResponse,
  AskNutritionCoachBody,
  AskNutritionCoachResponse,
  LookupBarcodeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const model = "gpt-5.6-terra";

function decodeJson(content: string | null): unknown {
  if (!content) throw new Error("The AI service returned an empty answer.");
  return JSON.parse(content);
}

router.post("/nutrition/analyze", async (req, res) => {
  const input = AnalyzeMealBody.safeParse(req.body);
  if (!input.success || !/^image\/(jpeg|png|webp)$/.test(input.data.imageMimeType) || input.data.imageBase64.length > 14_000_000) {
    res.status(400).json({ error: "Please upload a JPEG, PNG, or WebP meal photo under 10 MB." });
    return;
  }
  try {
    const result = await openai.chat.completions.create({
      model,
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You estimate food nutrition from a photo for general wellness. Return ONLY JSON with name, calories, protein, carbs, fat (nonnegative rounded integers), portion (brief approximate serving), confidence (low, medium, high), and items (food names array). Never imply medical precision. If food is unclear, choose low confidence and a broad estimate. Respond in ${input.data.language === "ar" ? "Arabic" : "English"} for text fields. Never use shaming language.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Estimate the visible food and portion. Give approximate macros and an honest confidence rating." },
            { type: "image_url", image_url: { url: `data:${input.data.imageMimeType};base64,${input.data.imageBase64}` } },
          ],
        },
      ],
    });
    const data = AnalyzeMealResponse.parse(decodeJson(result.choices[0]?.message?.content ?? null));
    res.json(data);
  } catch (error) {
    req.log.error({ err: error }, "Meal analysis failed");
    res.status(503).json({ error: "Meal analysis is temporarily unavailable. Please try again." });
  }
});

router.post("/nutrition/meal-plan", async (req, res) => {
  const input = GenerateMealPlanBody.safeParse(req.body);
  if (!input.success || input.data.calorieTarget < 1200 || input.data.calorieTarget > 5000) {
    res.status(400).json({ error: "Please provide a valid daily calorie target." });
    return;
  }
  try {
    const { calorieTarget, proteinTarget, carbsTarget, fatTarget, preferences, exclusions, language } = input.data;
    const result = await openai.chat.completions.create({
      model,
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a supportive meal planner. Return ONLY a JSON object with meals (exactly 21 objects: breakfast, lunch and dinner for each of Monday through Sunday) and groceryList (strings grouped as "Category: item"). Every meal requires day, type, name, calories, protein, carbs, fat (nonnegative integers), and recipe (one short practical sentence). Include Lebanese or Middle Eastern meals across the week. Respect halal/vegetarian/allergies, avoid exclusions, and aim for daily calories within 10% of the requested target. Write names, recipes and grocery items in ${language === "ar" ? "Arabic" : "English"}. No medical advice or shame language.`,
        },
        {
          role: "user",
          content: `Daily target ${calorieTarget} kcal, ${proteinTarget}g protein, ${carbsTarget}g carbohydrates, ${fatTarget}g fat. Preferences: ${preferences.join(", ") || "none"}. Avoid: ${exclusions || "none"}.`,
        },
      ],
    });
    const plan = GenerateMealPlanResponse.parse(decodeJson(result.choices[0]?.message?.content ?? null));
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const valid = days.every((day) => {
      const dayMeals = plan.meals.filter((meal) => meal.day.toLowerCase() === day.toLowerCase());
      const total = dayMeals.reduce((sum, meal) => sum + meal.calories, 0);
      return dayMeals.length === 3 && total >= calorieTarget * 0.9 && total <= calorieTarget * 1.1;
    });
    if (!valid) throw new Error("Generated plan missed a daily calorie target.");
    res.json(plan);
  } catch (error) {
    req.log.error({ err: error }, "Meal plan generation failed");
    res.status(503).json({ error: "We could not build a balanced week just now. Please try again." });
  }
});

router.post("/nutrition/coach", async (req, res) => {
  const input = AskNutritionCoachBody.safeParse(req.body);
  if (!input.success || input.data.message.length > 3000 || input.data.context.length > 12000) {
    res.status(400).json({ error: "Please shorten your message and try again." });
    return;
  }
  const { message, context, language } = input.data;
  if (/\b(purge|purging|starve|starving|stop eating|eat nothing|laxative|self.harm)\b/i.test(message)) {
    res.json(AskNutritionCoachResponse.parse({
      answer: language === "ar"
        ? "يبدو أن علاقتك بالطعام صعبة الآن. تستحق الدعم والرحمة. تحدث مع اختصاصي تغذية أو مختص في الصحة النفسية تثق به، وإذا كنت في خطر فاطلب المساعدة الطارئة المحلية."
        : "It sounds like food feels difficult right now. You deserve support and care. Please reach out to a trusted dietitian or mental-health professional; if you are in immediate danger, contact local emergency services.",
    }));
    return;
  }
  try {
    const result = await openai.chat.completions.create({
      model,
      max_completion_tokens: 8192,
      messages: [
        {
          role: "system",
          content: `You are Pulse's supportive nutrition coach. Use the user's actual diary and targets below, not invented numbers. Keep answers concise and practical. Respond in ${language === "ar" ? "Arabic" : "English"}. Never recommend fewer than 1200 kcal for women or 1500 kcal for men, never shame, and do not diagnose or prescribe treatment. If you notice possible disordered eating, respond supportively and suggest professional help. If asked to edit the plan or targets, clearly explain you can offer a suggestion but the user must save changes in Plan or Profile. User context:\n${context}`,
        },
        { role: "user", content: message },
      ],
    });
    res.json(AskNutritionCoachResponse.parse({ answer: result.choices[0]?.message?.content ?? "" }));
  } catch (error) {
    req.log.error({ err: error }, "Nutrition coaching failed");
    res.status(503).json({ error: "Coach is temporarily unavailable. Please try again." });
  }
});

router.get("/nutrition/barcode/:barcode", async (req, res) => {
  const barcode = String(req.params.barcode ?? "");
  if (!/^\d{8,14}$/.test(barcode)) {
    res.status(400).json({ error: "Enter a valid 8–14 digit barcode." });
    return;
  }
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,serving_size,nutriments`,
      {
        headers: { "User-Agent": "PulseNutrition/0.1 (nutrition lookup)" },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) throw new Error(`Food database returned ${response.status}`);
    const result = await response.json() as {
      status?: number;
      product?: {
        product_name?: string;
        serving_size?: string;
        nutriments?: Record<string, number | string | undefined>;
      };
    };
    const product = result.product;
    if (result.status !== 1 || !product?.nutriments) {
      res.status(404).json({ error: "No product was found for this barcode. Try manual search." });
      return;
    }
    const readNutrient = (key: string) => Number(product.nutriments?.[key]);
    const values = [
      readNutrient("energy-kcal_100g"),
      readNutrient("proteins_100g"),
      readNutrient("carbohydrates_100g"),
      readNutrient("fat_100g"),
    ];
    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
      res.status(404).json({ error: "This product has no complete nutrition label. Try manual search." });
      return;
    }
    const servingText = product.serving_size?.trim() || "";
    const servingGrams = /^\d+([.,]\d+)?\s*g\b/i.test(servingText)
      ? Number.parseFloat(servingText.replace(",", "."))
      : 100;
    const factor = servingGrams > 0 && servingGrams <= 1000 ? servingGrams / 100 : 1;
    res.json(LookupBarcodeResponse.parse({
      barcode,
      name: product.product_name?.trim() || "Packaged food",
      calories: Math.round(values[0]! * factor),
      protein: Math.round(values[1]! * factor),
      carbs: Math.round(values[2]! * factor),
      fat: Math.round(values[3]! * factor),
      portion: factor === 1 ? "100 g" : servingText,
    }));
  } catch (error) {
    req.log.error({ err: error }, "Barcode lookup failed");
    res.status(503).json({ error: "The nutrition database is unavailable. Please try again." });
  }
});

export default router;