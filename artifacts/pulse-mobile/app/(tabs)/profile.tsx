import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Share, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button, C, Card, Chips, Empty, Field, Page, Section, Txt } from '@/components/Primitives';
import { calculateTargets, Profile, usePulse, useT } from '@/lib/pulse';

export default function ProfileScreen() {
  const store=usePulse();
  const {profile,update,clear}=store;
  const {t,language,rtl}=useT();
  const [form,setForm]=useState<Profile|null>(profile);
  const [editing,setEditing]=useState(false);
  const [customTargets,setCustomTargets]=useState(false);
  const [eraseOpen,setEraseOpen]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{setForm(profile)},[profile]);
  const patch=(p:Partial<Profile>)=>setForm(f=>f?{...f,...p}:null);
  const save=()=>{
    if(!form)return;
    if(form.age<16||form.age>110||form.height<100||form.height>240||form.weight<25||form.weight>400||
      Object.values(form.targets).some(v=>!Number.isFinite(v)||v<0)||form.targets.calories<(form.sex==='female'?1200:1500)){
      setError(t.validation);return;
    }
    update({profile:{...form,language,targets:customTargets?form.targets:calculateTargets(form)}});setEditing(false);setError('');
  };
  const changeLanguage=(l:'en'|'ar')=>{update({language:l,profile:profile?{...profile,language:l}:null});if(form)patch({language:l})};
  const share=async()=>{try{await Share.share({message:JSON.stringify({exportedAt:new Date().toISOString(),profile:store.profile,meals:store.meals,water:store.water,weights:store.weights,plan:store.plan,groceries:store.groceries,messages:store.messages},null,2),title:'Pulse data export'});}catch{setError(t.exportError)}};
  if(!profile)return <Page title={t.settings}><Card><Empty icon="user" title={t.onboardDetailsSub}/><Button label={t.start} onPress={()=>router.replace('/')}/></Card><Section title={t.language}/><Chips values={['en','ar']} value={language} onChange={changeLanguage} labels={v=>v==='en'?'English':'العربية'}/></Page>;
  return <Page overline="PULSE / YOU" title={t.settings} subtitle={t.readySub}>
    <Card style={{backgroundColor:'#1B2717',borderColor:'#344825'}}>
      <View style={{flexDirection:rtl?'row-reverse':'row',alignItems:'center',gap:12,marginBottom:17}}><View style={{width:46,height:46,borderRadius:15,backgroundColor:C.primary,alignItems:'center',justifyContent:'center'}}><Feather name="activity" color={C.primaryForeground} size={23}/></View><View style={{flex:1}}><Txt display size={21}>PULSE</Txt><Txt size={12} color={C.mutedForeground}>{t.calculated}</Txt></View></View>
      <View style={{flexDirection:rtl?'row-reverse':'row',gap:13}}><View style={{flex:1}}><Txt color={C.mutedForeground} size={11}>{t.goal}</Txt><Txt bold>{t[profile.goal]}</Txt></View><View style={{flex:1}}><Txt color={C.mutedForeground} size={11}>{t.target}</Txt><Txt bold>{profile.gentle?'—':`${profile.targets.calories} ${t.kcal}`}</Txt></View></View>
    </Card>
    <Section title={t.goals}/><Button label={editing?t.cancel:t.targetEdit} icon={editing?'x':'edit-2'} kind="secondary" onPress={()=>{if(editing)setForm(profile);setEditing(!editing);setError('')}}/>
    {editing&&form&&<View style={{marginTop:14}}>
      <Card><Txt size={12} bold color={C.mutedForeground} style={{marginBottom:10}}>{t.goal}</Txt><Chips values={['lose','maintain','gain']} value={form.goal} onChange={goal=>patch({goal})} labels={v=>t[v]}/>
        <Txt size={12} bold color={C.mutedForeground} style={{marginTop:20,marginBottom:10}}>{t.sex}</Txt><Chips values={['female','male']} value={form.sex} onChange={sex=>patch({sex})} labels={v=>t[v]}/>
        <View style={{height:18}}/><Field label={t.age} value={String(form.age||'')} onChangeText={v=>patch({age:Number(v)})} keyboardType="numeric"/>
        <Field label={t.height} value={String(form.height||'')} onChangeText={v=>patch({height:Number(v)})} keyboardType="decimal-pad"/>
        <Field label={t.weightLabel} value={String(form.weight||'')} onChangeText={v=>patch({weight:Number(v)})} keyboardType="decimal-pad"/>
        <Txt size={12} bold color={C.mutedForeground} style={{marginBottom:10}}>{t.activity}</Txt><Chips values={['sedentary','light','moderate','active']} value={form.activity} onChange={activity=>patch({activity})} labels={v=>t[v]}/>
        <View style={{height:20}}/><Field label={t.country} value={form.country} onChangeText={v=>patch({country:v})}/>
        <Field label={t.allergies} value={form.allergies} onChangeText={v=>patch({allergies:v})}/>
        <View style={{flexDirection:rtl?'row-reverse':'row',justifyContent:'space-between',alignItems:'center',minHeight:49}}><Txt>{t.halal}</Txt><Switch value={form.halal} onValueChange={v=>patch({halal:v})} trackColor={{true:C.primary,false:C.border}} thumbColor={C.foreground}/></View>
        <View style={{flexDirection:rtl?'row-reverse':'row',justifyContent:'space-between',alignItems:'center',minHeight:49}}><Txt>{t.vegetarian}</Txt><Switch value={form.vegetarian} onValueChange={v=>patch({vegetarian:v})} trackColor={{true:C.primary,false:C.border}} thumbColor={C.foreground}/></View>
        <View style={{flexDirection:rtl?'row-reverse':'row',justifyContent:'space-between',alignItems:'center',minHeight:55,marginTop:8}}><Txt bold>{t.targetEdit}</Txt><Switch value={customTargets} onValueChange={setCustomTargets} trackColor={{true:C.primary,false:C.border}} thumbColor={C.foreground}/></View>
        {customTargets&&<><Field label={`${t.energy} (${t.kcal})`} value={String(form.targets.calories||'')} onChangeText={v=>patch({targets:{...form.targets,calories:Number(v)}})} keyboardType="numeric"/>
          {(['protein','carbs','fat'] as const).map(k=><Field key={k} label={`${t[k]} (g)`} value={String(form.targets[k]||'')} onChangeText={v=>patch({targets:{...form.targets,[k]:Number(v)}})} keyboardType="numeric"/>)}</>}
        {!!error&&<Txt color={C.destructive} size={13} style={{marginVertical:9}}>{error}</Txt>}
        <Button label={t.save} icon="check" onPress={save} style={{marginTop:16}}/>
      </Card>
    </View>}
    <Section title={t.preferences}/>
    <Card>
      <Txt bold style={{marginBottom:11}}>{t.language}</Txt><Chips values={['en','ar']} value={language} onChange={changeLanguage} labels={v=>v==='en'?'English':'العربية'}/>
      <View style={{height:1,backgroundColor:C.border,marginVertical:19}}/>
      <View style={{flexDirection:rtl?'row-reverse':'row',alignItems:'center',justifyContent:'space-between',gap:10}}><View style={{flex:1}}><Txt bold>{t.gentle}</Txt><Txt size={12} color={C.mutedForeground} style={{marginTop:3}}>{t.gentleDesc}</Txt></View><Switch value={profile.gentle} onValueChange={gentle=>update({profile:{...profile,gentle}})} trackColor={{true:C.primary,false:C.border}} thumbColor={C.foreground}/></View>
    </Card>
    <Section title={t.privacy}/>
    <Card style={{padding:9}}>
      <Button label={t.export} icon="share-2" kind="ghost" onPress={share} style={{justifyContent:'flex-start'}}/>
      <View style={{height:1,backgroundColor:C.border,marginHorizontal:13}}/>
      <Button label={t.erase} icon="trash-2" kind="danger" onPress={()=>setEraseOpen(true)} style={{marginTop:9}}/>
    </Card>
    {!!error&&!editing&&<Txt color={C.destructive} size={13} style={{marginTop:10}}>{error}</Txt>}
    <Section title={t.about}/><Txt color={C.mutedForeground} size={13} style={{lineHeight:21,marginBottom:20}}>{t.legal}</Txt>
    <Txt color={C.mutedForeground} size={12}>{t.billing}</Txt>
    <Modal visible={eraseOpen} transparent animationType="fade" onRequestClose={()=>setEraseOpen(false)}><View style={{flex:1,backgroundColor:'#07090CEB',justifyContent:'center',padding:24}}><Card><Txt display size={25}>{t.eraseAsk}</Txt><Txt color={C.mutedForeground} style={{marginTop:10,marginBottom:20}}>{t.eraseBody}</Txt><Button label={t.erase} kind="danger" onPress={()=>{setEraseOpen(false);clear();router.replace('/')}}/><Button label={t.cancel} kind="ghost" onPress={()=>setEraseOpen(false)}/></Card></View></Modal>
  </Page>;
}