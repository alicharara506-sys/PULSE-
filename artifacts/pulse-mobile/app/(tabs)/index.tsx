import React, { useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Svg, { Polyline } from 'react-native-svg';
import Onboarding from '@/components/Onboarding';
import { Beat, Button, C, Card, Empty, IconButton, Macro, Page, Ring, Section, Txt } from '@/components/Primitives';
import { dateKey, usePulse, useT } from '@/lib/pulse';

export default function Home() {
  const {profile,ready,meals,water,weights,addWater,addWeight}=usePulse();
  const {t,rtl}=useT();
  const [weightInput,setWeightInput]=useState('');
  const [weightOpen,setWeightOpen]=useState(false);
  const [error,setError]=useState('');
  if(!ready) return <View style={{flex:1,backgroundColor:C.background}}/>;
  if(!profile) return <Onboarding/>;
  const today=meals.filter(m=>m.date===dateKey());
  const total=(key:'calories'|'protein'|'carbs'|'fat')=>today.reduce((a,m)=>a+m[key],0);
  const ml=water.filter(w=>w.date===dateKey()).reduce((a,w)=>a+w.value,0);
  const remaining=Math.max(0,profile.targets.calories-total('calories'));
  return <Page overline={t.today} title={t.greeting} subtitle={t.hero} right={<Beat width={65}/>}>
    <Card style={{padding:22,backgroundColor:'#172017',borderColor:'#344528'}}>
      <View style={{alignItems:'center',paddingVertical:7}}>
        <Ring progress={total('calories')/profile.targets.calories} size={192}>
          <View style={{alignItems:'center'}}><Feather name="activity" size={20} color={C.primary}/><Txt display size={profile.gentle?24:36} color={C.foreground} style={{letterSpacing:-1.5,marginTop:3}}>{profile.gentle?t.energy:remaining}</Txt><Txt size={12} color={C.mutedForeground}>{profile.gentle?t.nudge:`${t.kcal} ${t.remaining}`}</Txt></View>
        </Ring>
      </View>
      {!profile.gentle && <View style={{flexDirection:rtl?'row-reverse':'row',justifyContent:'space-around',marginTop:10,marginBottom:20}}>
        <View style={{alignItems:'center'}}><Txt display size={21}>{Math.round(total('calories'))}</Txt><Txt size={11} color={C.mutedForeground}>{t.eaten}</Txt></View>
        <View style={{width:1,backgroundColor:C.border}}/>
        <View style={{alignItems:'center'}}><Txt display size={21}>{profile.targets.calories}</Txt><Txt size={11} color={C.mutedForeground}>{t.target}</Txt></View>
      </View>}
      <View style={{height:1,backgroundColor:C.border,marginBottom:21}}/>
      <View style={{flexDirection:rtl?'row-reverse':'row',gap:16}}>
        <Macro name={t.protein} value={total('protein')} target={profile.targets.protein} color={C.primary}/>
        <Macro name={t.carbs} value={total('carbs')} target={profile.targets.carbs} color={C.teal}/>
        <Macro name={t.fat} value={total('fat')} target={profile.targets.fat} color={C.amber}/>
      </View>
    </Card>
    <Button label={t.quickAdd} icon="plus" onPress={()=>router.push('/log')} style={{marginTop:15}}/>
    <Section title={t.diary} right={<IconButton icon="arrow-up-right" label={t.log} onPress={()=>router.push('/log')}/>}/>
    {today.length===0?<Card><Empty icon="aperture" title={t.diaryEmpty}/></Card>:today.map(m=><Pressable key={m.id} onPress={()=>router.push('/log')} style={({pressed})=>({opacity:pressed?.65:1,marginBottom:9})}><Card style={{padding:11,flexDirection:rtl?'row-reverse':'row',alignItems:'center',gap:12}}>
      {m.photoUri?<Image source={{uri:m.photoUri}} style={{width:55,height:55,borderRadius:11}}/>:<View style={{width:55,height:55,borderRadius:11,backgroundColor:C.secondary,alignItems:'center',justifyContent:'center'}}><Feather name="coffee" color={C.primary} size={22}/></View>}
      <View style={{flex:1}}><Txt bold lines={1}>{m.name}</Txt><Txt size={12} color={C.mutedForeground}>{t[m.type]} · {m.portion}</Txt></View>
      {!profile.gentle&&<Txt bold color={C.primary}>{Math.round(m.calories)} <Txt size={10} color={C.mutedForeground}>{t.kcal}</Txt></Txt>}
    </Card></Pressable>)}
    <View style={{flexDirection:rtl?'row-reverse':'row',gap:11,marginTop:14}}>
      <Card style={{flex:1,padding:16}}><Feather name="droplet" size={20} color={C.teal}/><Txt size={12} color={C.mutedForeground} style={{marginTop:13}}>{t.water}</Txt><Txt display size={22}>{ml} <Txt size={11} color={C.mutedForeground}>ml</Txt></Txt><Button label={t.addWater} kind="secondary" onPress={()=>addWater(250)} style={{marginTop:13,paddingHorizontal:5,minHeight:44}}/></Card>
      <Card style={{flex:1,padding:16}}><Feather name="trending-up" size={20} color={C.amber}/><Txt size={12} color={C.mutedForeground} style={{marginTop:13}}>{t.weight}</Txt><Txt display size={22}>{weights.length?weights[0].value:profile.weight} <Txt size={11} color={C.mutedForeground}>{t.kg}</Txt></Txt><Button label={t.logWeight} kind="secondary" onPress={()=>{setWeightInput('');setWeightOpen(!weightOpen)}} style={{marginTop:13,paddingHorizontal:5,minHeight:44}}/></Card>
    </View>
    {weightOpen&&<Card style={{marginTop:10}}><Txt bold style={{marginBottom:10}}>{t.checkIn}</Txt><View style={{flexDirection:'row',gap:9}}><View style={{flex:1}}><FieldMini value={weightInput} onChange={setWeightInput}/></View><Button label={t.save} onPress={()=>{const n=Number(weightInput);if(n>=25&&n<=400){addWeight(n);setWeightOpen(false);setError('')}else setError(t.validation)}}/></View>{!!error&&<Txt size={12} color={C.destructive}>{error}</Txt>}</Card>}
    {weights.length>0&&<Card style={{marginTop:10,padding:14}}>
      <Txt size={11} color={C.mutedForeground} bold>{t.trend}</Txt>
      {weights.length>1&&<Svg width="100%" height={43} viewBox="0 0 300 43" style={{marginTop:8}}>
        <Polyline points={weights.slice(0,8).reverse().map((w,i,a)=>`${i*300/(a.length-1)},${35-(w.value-Math.min(...a.map(x=>x.value)))/(Math.max(1,Math.max(...a.map(x=>x.value))-Math.min(...a.map(x=>x.value))))*28}`).join(' ')} stroke={C.primary} strokeWidth="2.5" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
      </Svg>}
      <Txt size={12} color={C.foreground} style={{marginTop:6}}>{weights.slice(0,4).map(w=>`${w.value} ${t.kg}`).join('  ·  ')}</Txt>
    </Card>}
    <Section title={t.insight}/><Card style={{flexDirection:rtl?'row-reverse':'row',gap:13,alignItems:'center'}}><Feather name="zap" size={19} color={C.primary}/><Txt size={13} color={C.secondaryForeground} style={{flex:1}}>{today.length?t.insightData.replace('{count}',String(today.length)):t.insightEmpty}</Txt></Card>
  </Page>;
}
function FieldMini({value,onChange}:{value:string;onChange:(s:string)=>void}) {return <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder="kg" placeholderTextColor={C.mutedForeground} style={{height:50,borderRadius:12,borderWidth:1,borderColor:C.border,color:C.foreground,paddingHorizontal:14,backgroundColor:C.secondary}}/>;}