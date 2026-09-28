import React, { useState } from 'react';
import { View, Pressable, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Beat, Button, C, Card, Chips, Field, Txt } from '@/components/Primitives';
import { calculateTargets, Profile, usePulse, useT } from '@/lib/pulse';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

export default function Onboarding() {
  const { update } = usePulse();
  const { t, language, rtl } = useT();
  const insets = useSafeAreaInsets();
  const [step,setStep]=useState(0);
  const [goal,setGoal]=useState<Profile['goal']>('maintain');
  const [sex,setSex]=useState<Profile['sex']>('female');
  const [activity,setActivity]=useState<Profile['activity']>('light');
  const [age,setAge]=useState('28');
  const [height,setHeight]=useState('165');
  const [weight,setWeight]=useState('68');
  const [country,setCountry]=useState('');
  const [allergies,setAllergies]=useState('');
  const [halal,setHalal]=useState(false);
  const [vegetarian,setVegetarian]=useState(false);
  const [error,setError]=useState('');
  const valid=Number(age)>=16&&Number(age)<=110&&Number(height)>=100&&Number(height)<=240&&Number(weight)>=25&&Number(weight)<=400;
  const targets=calculateTargets({goal,sex,activity,age:Number(age)||28,height:Number(height)||165,weight:Number(weight)||68});
  const next=()=>{if(step===2&&!valid){setError(t.validation);return;}setError('');setStep(s=>Math.min(4,s+1));};
  const finish=()=>{
    if(!valid){setStep(2);setError(t.validation);return;}
    update({profile:{language,goal,age:Number(age),sex,height:Number(height),weight:Number(weight),activity,halal,vegetarian,allergies:allergies.trim(),country:country.trim(),gentle:false,targets}});
  };
  return <KeyboardAwareScrollViewCompat style={{flex:1,backgroundColor:C.background}} contentContainerStyle={{paddingHorizontal:26,paddingTop:Math.max(insets.top,Platform.OS==='web'?67:14)+24,paddingBottom:50,minHeight:760,maxWidth:600,width:'100%',alignSelf:'center'}} bottomOffset={50} keyboardShouldPersistTaps="handled">
    <View style={[{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},rtl&&{flexDirection:'row-reverse'}]}><Txt display size={22} color={C.primary} style={{letterSpacing:-1}}>PULSE</Txt><Beat width={75}/></View>
    <View style={{flexDirection:'row',gap:5,marginTop:36,marginBottom:38}}>{[0,1,2,3,4].map(i=><View key={i} style={{height:3,flex:1,backgroundColor:i<=step?C.primary:C.border,borderRadius:4}}/>)}</View>
    {step===0 && <>
      <Txt size={11} bold color={C.primary} style={{letterSpacing:2,marginBottom:13}}>{t.chooseLang}</Txt>
      <Txt display size={43} style={{letterSpacing:-2,lineHeight:48,marginBottom:13}}>{t.welcome}</Txt>
      <Txt size={16} color={C.mutedForeground} style={{marginBottom:32}}>{t.welcomeSub}</Txt>
      <Image source={require('../assets/images/meal-lebanese.jpg')} style={{width:'100%',height:174,borderRadius:16,marginBottom:23}} resizeMode="cover"/>
      <View style={{gap:10}}>{([{id:'en',label:'English',secondary:'Continue in English'},{id:'ar',label:'العربية',secondary:'المتابعة بالعربية'}] as const).map(option=><Pressable key={option.id} onPress={()=>update({language:option.id})} style={({pressed})=>({backgroundColor:C.card,borderColor:language===option.id?C.primary:C.border,borderWidth:1,borderRadius:16,padding:20,minHeight:75,opacity:pressed?.7:1})}><Txt size={18} bold color={language===option.id?C.primary:C.foreground}>{option.label}</Txt><Txt size={12} color={C.mutedForeground}>{option.secondary}</Txt></Pressable>)}</View>
    </>}
    {step===1 && <>
      <Txt display size={34} style={{letterSpacing:-1.4,marginBottom:9}}>{t.onboardGoal}</Txt><Txt color={C.mutedForeground} style={{marginBottom:26}}>{t.onboardBody}</Txt>
      <View style={{gap:10}}>{(['lose','maintain','gain'] as const).map(g=><Pressable key={g} onPress={()=>setGoal(g)} style={({pressed})=>({borderRadius:16,borderWidth:1,borderColor:goal===g?C.primary:C.border,backgroundColor:goal===g?'#202A18':C.card,padding:20,minHeight:70,justifyContent:'center',opacity:pressed?.7:1})}><Txt size={19} display color={goal===g?C.primary:C.foreground}>{t[g]}</Txt></Pressable>)}</View>
    </>}
    {step===2 && <>
      <Txt display size={34} style={{letterSpacing:-1.4,marginBottom:9}}>{t.onboardDetails}</Txt><Txt color={C.mutedForeground} style={{marginBottom:24}}>{t.onboardDetailsSub}</Txt>
      <Txt size={12} bold color={C.mutedForeground} style={{marginBottom:9}}>{t.sex}</Txt><Chips values={['female','male']} value={sex} onChange={setSex} labels={v=>t[v]}/>
      <View style={{height:22}}/><Field label={t.age} value={age} onChangeText={setAge} keyboardType="numeric"/>
      <Field label={t.height} value={height} onChangeText={setHeight} keyboardType="decimal-pad"/>
      <Field label={t.weightLabel} value={weight} onChangeText={setWeight} keyboardType="decimal-pad"/>
    </>}
    {step===3 && <>
      <Txt display size={34} style={{letterSpacing:-1.4,marginBottom:9}}>{t.onboardPrefs}</Txt><Txt color={C.mutedForeground} style={{marginBottom:24}}>{t.onboardPrefsSub}</Txt>
      <Txt size={12} bold color={C.mutedForeground} style={{marginBottom:9}}>{t.activity}</Txt><Chips values={['sedentary','light','moderate','active']} value={activity} onChange={setActivity} labels={v=>t[v]}/>
      <View style={{height:22}}/>
      <View style={{flexDirection:rtl?'row-reverse':'row',gap:10,marginBottom:18}}>
        {([{value:halal,set:setHalal,label:t.halal},{value:vegetarian,set:setVegetarian,label:t.vegetarian}]).map(o=><Pressable key={o.label} onPress={()=>o.set(!o.value)} style={{minHeight:48,borderRadius:12,borderWidth:1,borderColor:o.value?C.primary:C.border,paddingHorizontal:17,justifyContent:'center',backgroundColor:o.value?'#202A18':C.card}}><Txt bold color={o.value?C.primary:C.foreground}>{o.label}</Txt></Pressable>)}
      </View>
      <Field label={t.allergies} value={allergies} onChangeText={setAllergies}/><Field label={t.country} value={country} onChangeText={setCountry}/>
    </>}
    {step===4 && <>
      <Txt display size={37} style={{letterSpacing:-1.6,marginBottom:9}}>{t.readyTitle}</Txt><Txt color={C.mutedForeground} style={{marginBottom:25}}>{t.readySub}</Txt>
      <Card style={{padding:25,backgroundColor:'#1C2817',borderColor:'#344825'}}>
        <Txt size={11} bold color={C.primary} style={{letterSpacing:2}}>{t.energy}</Txt>
        <Txt display size={48} color={C.primary} style={{letterSpacing:-2,marginTop:5}}>{targets.calories}<Txt size={15} color={C.primary}> {t.kcal}</Txt></Txt>
        <View style={{height:1,backgroundColor:'#344825',marginVertical:20}}/>
        <Txt color={C.mutedForeground} size={13}>{t.protein} {targets.protein}g   ·   {t.carbs} {targets.carbs}g   ·   {t.fat} {targets.fat}g</Txt>
      </Card>
      <Txt color={C.mutedForeground} size={12} style={{marginTop:14,marginBottom:18}}>{t.calculated}</Txt>
      <Button label={t.tryPhoto} icon="camera" kind="secondary" onPress={()=>router.push('/log')}/>
      <Txt size={12} color={C.mutedForeground} style={{marginTop:12,textAlign:'center'}}>{t.noAccount}</Txt>
    </>}
    {!!error && <Txt color={C.destructive} size={13} style={{marginTop:15}}>{error}</Txt>}
    <View style={{flex:1,minHeight:35}}/>
    <View style={{gap:10,marginTop:28}}><Button label={step===4?t.finish:t.continue} icon={step===4?'check':'arrow-right'} onPress={step===4?finish:next}/>{step>0&&<Button label={t.back} kind="ghost" onPress={()=>setStep(s=>s-1)}/>}</View>
  </KeyboardAwareScrollViewCompat>;
}