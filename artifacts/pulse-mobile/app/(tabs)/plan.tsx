import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useGenerateMealPlan } from '@workspace/api-client-react';
import { Button, C, Card, Empty, IconButton, Page, Section, Skeleton, Txt } from '@/components/Primitives';
import { dateKey, PlannedMeal, uid, usePulse, useT } from '@/lib/pulse';

export default function Plan() {
  const {profile,plan,groceries,update,addMeal}=usePulse();
  const {t,language,rtl}=useT();
  const generate=useGenerateMealPlan();
  const [active,setActive]=useState(0);
  const [view,setView]=useState<'meals'|'grocery'>('meals');
  const [selected,setSelected]=useState<PlannedMeal|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState('');
  const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()+i);return d});
  const request=()=>({calorieTarget:profile!.targets.calories,proteinTarget:profile!.targets.protein,carbsTarget:profile!.targets.carbs,fatTarget:profile!.targets.fat,
    preferences:[...(profile!.halal?['halal']:[]),...(profile!.vegetarian?['vegetarian']:[]),`Country: ${profile!.country||'not specified'}`,`Goal: ${profile!.goal}`],
    exclusions:profile!.allergies,language});
  const build=async()=>{
    if(!profile)return;setError('');setBusy('all');
    try {const result=await generate.mutateAsync({data:request()});if(!result.meals.length)throw new Error('empty');update({plan:result.meals,groceries:result.groceryList});}
    catch {setError(t.failed);} finally {setBusy('');}
  };
  const swap=async(meal:PlannedMeal)=>{
    if(!profile)return;setError('');setBusy(`${meal.day}-${meal.type}`);
    try {
      const result=await generate.mutateAsync({data:{...request(),preferences:[...request().preferences,`Swap only ${meal.day} ${meal.type}: avoid ${meal.name}; provide a different meal for the same slot.`]}});
      const replacement=result.meals.find(m=>m.day.toLowerCase()===meal.day.toLowerCase()&&m.type.toLowerCase()===meal.type.toLowerCase());
      if(!replacement)throw new Error('missing slot');
      update({plan:plan.map(m=>m===meal?replacement:m),groceries:result.groceryList});
      setSelected(null);
    } catch {setError(t.failed);} finally {setBusy('');}
  };
  const log=(m:PlannedMeal)=>{
    addMeal({id:uid(),date:dateKey(),type:(['breakfast','lunch','dinner','snack'].includes(m.type.toLowerCase())?m.type.toLowerCase():'lunch') as 'breakfast'|'lunch'|'dinner'|'snack',source:'plan',name:m.name,portion:'1 serving',calories:m.calories,protein:m.protein,carbs:m.carbs,fat:m.fat});
    setSelected(null);
  };
  const day=days[active];
  const plannedDays=[...new Set(plan.map(m=>m.day))];
  const key=plannedDays[active] ?? day.toLocaleDateString('en-US',{weekday:'long'});
  const dayMeals=plan.filter(m=>m.day.toLowerCase()===key.toLowerCase()||m.day.toLowerCase().startsWith(key.slice(0,3).toLowerCase())||m.day===String(active+1));
  const grouped=groceries.reduce<Record<string,string[]>>((acc,item)=>{
    const group=/chicken|beef|fish|salmon|egg|milk|cheese|yogurt|labneh|tofu|لحم|دجاج|سمك|بيض|حليب|جبن|لبن/i.test(item)?(language==='ar'?'بروتين وألبان':'Protein & dairy'):/rice|bread|pita|oat|pasta|خبز|أرز|شوفان|معكرونة/i.test(item)?(language==='ar'?'حبوب ومخزن':'Grains & pantry'):(language==='ar'?'خضار وأكثر':'Produce & more');
    (acc[group]??=[]).push(item);return acc;
  },{});
  return <Page overline="PULSE / 07" title={t.weekly} subtitle={t.planSub}>
    {!profile?<Card><Empty icon="calendar" title={t.planEmpty} detail={t.onboardDetailsSub}/></Card>:<>
      <View style={{flexDirection:rtl?'row-reverse':'row',gap:9}}><Button label={t.meals} kind={view==='meals'?'primary':'secondary'} onPress={()=>setView('meals')} style={{flex:1}}/><Button label={t.grocery} kind={view==='grocery'?'primary':'secondary'} onPress={()=>setView('grocery')} style={{flex:1}}/></View>
      {plan.length===0?<View style={{marginTop:20}}><Card><Empty icon="calendar" title={t.planEmpty}/></Card><Button label={t.generate} icon="zap" onPress={build} disabled={!!busy} style={{marginTop:14}}/></View>:<>
        {view==='meals'?<>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,marginTop:26,marginBottom:20,flexDirection:rtl?'row-reverse':'row'}}>{days.map((d,i)=><Pressable key={i} onPress={()=>setActive(i)} style={({pressed})=>({width:52,height:66,borderRadius:14,backgroundColor:i===active?C.primary:C.card,borderWidth:1,borderColor:i===active?C.primary:C.border,alignItems:'center',justifyContent:'center',opacity:pressed?.7:1})}><Txt color={i===active?C.primaryForeground:C.mutedForeground} size={10} bold lines={1}>{(plannedDays[i]??d.toLocaleDateString(language==='ar'?'ar':'en',{weekday:'short'})).slice(0,3)}</Txt><Txt display size={20} color={i===active?C.primaryForeground:C.foreground}>{i+1}</Txt></Pressable>)}</ScrollView>
          <Txt display size={21} style={{marginBottom:12}}>{key}</Txt>
          {dayMeals.length?dayMeals.map((m,i)=><Pressable key={`${m.day}-${m.type}-${i}`} onPress={()=>setSelected(m)} style={({pressed})=>({opacity:pressed?.7:1,marginBottom:10})}><Card style={{padding:18}}>
            <View style={{flexDirection:rtl?'row-reverse':'row',justifyContent:'space-between',alignItems:'center'}}><Txt size={10} bold color={C.primary} style={{letterSpacing:1.4}}>{m.type.toUpperCase()}</Txt><Feather name="arrow-up-right" color={C.mutedForeground} size={16}/></View>
            <Txt display size={20} style={{marginTop:9,marginBottom:7}}>{m.name}</Txt>
            <Txt color={C.mutedForeground} size={12}>{profile.gentle?'':`${Math.round(m.calories)} ${t.kcal}   ·   `}{Math.round(m.protein)}g {t.protein}   ·   {Math.round(m.carbs)}g {t.carbs}</Txt>
          </Card></Pressable>):<Card><Empty icon="calendar" title={t.emptyPlan}/></Card>}
        </>:<>
          <Section title={t.grocery}/>{Object.entries(grouped).length?Object.entries(grouped).map(([group,items])=><Card key={group} style={{marginBottom:11}}><Txt display size={19} style={{marginBottom:12}}>{group}</Txt>{items.map((item,i)=><View key={`${item}-${i}`} style={{flexDirection:rtl?'row-reverse':'row',alignItems:'center',gap:10,paddingVertical:8,borderTopWidth:1,borderTopColor:C.border}}><Feather name="circle" color={C.primary} size={15}/><Txt size={14}>{item}</Txt></View>)}</Card>):<Empty icon="shopping-bag" title={t.shoppingEmpty}/>}
        </>}
        <Button label={t.regenerate} kind="secondary" icon="refresh-cw" onPress={build} disabled={!!busy} style={{marginTop:19}}/>
      </>}
      {!!busy&&<View style={{marginTop:14}}><Skeleton height={80}/><Txt color={C.primary} size={12}>{t.thinking}</Txt></View>}
      {!!error&&!selected&&<Card style={{marginTop:13}}><Txt color={C.destructive} size={13}>{error}</Txt><Button label={t.retry} kind="secondary" onPress={build} style={{marginTop:12}}/></Card>}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={()=>setSelected(null)}><View style={{flex:1,justifyContent:'flex-end',backgroundColor:'#07090CCF'}}><ScrollView style={{maxHeight:'85%',backgroundColor:C.card,borderTopLeftRadius:24,borderTopRightRadius:24}} contentContainerStyle={{padding:24,paddingBottom:50}}>
        <View style={{flexDirection:rtl?'row-reverse':'row',justifyContent:'space-between'}}><Txt size={11} bold color={C.primary}>{selected?.day} / {selected?.type}</Txt><IconButton icon="x" label={t.cancel} onPress={()=>setSelected(null)}/></View>
        <Txt display size={27} style={{marginTop:10}}>{selected?.name}</Txt>
        <Txt size={13} color={C.mutedForeground} style={{marginTop:9}}>{profile.gentle?'':`${selected?.calories} ${t.kcal}  ·  `}{selected?.protein}g {t.protein}  ·  {selected?.carbs}g {t.carbs}  ·  {selected?.fat}g {t.fat}</Txt>
        <Section title={t.recipe}/><Txt size={15} style={{lineHeight:24,marginBottom:27}}>{selected?.recipe}</Txt>
        <Button label={t.logMeal} icon="plus" onPress={()=>selected&&log(selected)}/>
        <Button label={t.swap} icon="refresh-cw" kind="secondary" onPress={()=>selected&&swap(selected)} disabled={!!busy} style={{marginTop:10}}/>
        {!!error&&<Txt color={C.destructive} style={{marginTop:10}}>{error}</Txt>}
      </ScrollView></View></Modal>
    </>}
  </Page>;
}