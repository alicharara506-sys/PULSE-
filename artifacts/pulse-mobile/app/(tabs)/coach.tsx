import React, { useState } from 'react';
import { FlatList, Keyboard, Pressable, TextInput, View, Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAskNutritionCoach } from '@workspace/api-client-react';
import { Beat, C, IconButton, Txt } from '@/components/Primitives';
import { dateKey, uid, usePulse, useT } from '@/lib/pulse';

export default function Coach() {
  const {profile,meals,water,messages,update}=usePulse();
  const {t,language,rtl}=useT();
  const insets=useSafeAreaInsets();
  const ask=useAskNutritionCoach();
  const [input,setInput]=useState('');
  const [error,setError]=useState('');
  const [last,setLast]=useState('');
  const send=async(text:string,retry=false)=>{
    const message=text.trim();if(!message||ask.isPending)return;
    setError('');setLast(message);setInput('');Keyboard.dismiss();
    const next=retry?messages:[...messages,{id:uid(),role:'user' as const,text:message,date:new Date().toISOString()}];
    if(!retry)update({messages:next});
    const today=meals.filter(m=>m.date===dateKey());
    const context=JSON.stringify({
      profile:profile?{goal:profile.goal,targets:profile.targets,preferences:{halal:profile.halal,vegetarian:profile.vegetarian,allergies:profile.allergies,country:profile.country},gentle:profile.gentle}:null,
      today:{meals:today.map(({name,portion,calories,protein,carbs,fat,type})=>({name,portion,calories,protein,carbs,fat,type})),waterMl:water.filter(w=>w.date===dateKey()).reduce((a,w)=>a+w.value,0)},
      recentMessages:next.slice(-6).map(m=>({role:m.role,text:m.text})),
      instruction:'Be supportive, factual, non-judgmental. Do not give medical advice. Respect gentle mode.'
    });
    try {const response=await ask.mutateAsync({data:{message,context,language}});update({messages:[...next,{id:uid(),role:'assistant',text:response.answer,date:new Date().toISOString()}]});}
    catch {setError(t.coachError);}
  };
  return <KeyboardAvoidingView style={{flex:1,backgroundColor:C.background}} behavior="padding" keyboardVerticalOffset={0}>
    <View style={{paddingHorizontal:22,paddingTop:Math.max(insets.top,Platform.OS==='web'?67:12)+14,paddingBottom:18,borderBottomWidth:1,borderBottomColor:C.border,flexDirection:rtl?'row-reverse':'row',justifyContent:'space-between',alignItems:'center'}}>
      <View><Txt size={11} bold color={C.primary} style={{letterSpacing:1.8}}>PULSE / {t.coach.toUpperCase()}</Txt><Txt display size={24} style={{marginTop:4}}>{t.coachTitle}</Txt></View><Beat width={54}/>
    </View>
    <FlatList data={[...messages].reverse()} inverted keyExtractor={m=>m.id} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={{paddingHorizontal:20,paddingTop:20,paddingBottom:25,maxWidth:600,width:'100%',alignSelf:'center'}} renderItem={({item})=><View style={{alignSelf:item.role==='user'?(rtl?'flex-start':'flex-end'):(rtl?'flex-end':'flex-start'),maxWidth:'85%',backgroundColor:item.role==='user'?'#26351A':C.card,borderColor:item.role==='user'?'#405C28':C.border,borderWidth:1,paddingHorizontal:16,paddingVertical:13,borderRadius:17,marginBottom:12}}><Txt size={14} color={item.role==='user'?C.foreground:C.secondaryForeground}>{item.text}</Txt></View>} ListHeaderComponent={<>{ask.isPending&&<View style={{alignSelf:'flex-start',backgroundColor:C.card,borderRadius:16,padding:15,marginBottom:12}}><Txt color={C.primary} size={13}>{t.thinking}</Txt></View>}{!!error&&<View style={{backgroundColor:C.card,borderRadius:16,padding:15,marginBottom:12}}><Txt size={13} color={C.destructive}>{error}</Txt><Pressable onPress={()=>send(last,true)} style={{minHeight:44,justifyContent:'center'}}><Txt color={C.primary} bold>{t.retry}</Txt></Pressable></View>}</>}
      ListEmptyComponent={<View style={{transform:[{scaleY:-1}],paddingTop:30}}>
        <View style={{width:55,height:55,borderRadius:18,backgroundColor:'#25351B',alignItems:'center',justifyContent:'center',marginBottom:22}}><Feather name="activity" size={27} color={C.primary}/></View>
        <Txt display size={32} style={{lineHeight:38,marginBottom:10}}>{t.coachHello}</Txt><Txt color={C.mutedForeground} style={{marginBottom:28}}>{t.coachSub}</Txt>
        {[t.prompt1,t.prompt2,t.prompt3].map(p=><Pressable key={p} onPress={()=>send(p)} style={({pressed})=>({minHeight:56,borderRadius:14,borderWidth:1,borderColor:C.border,backgroundColor:C.card,padding:15,marginBottom:9,justifyContent:'center',opacity:pressed?.7:1})}><Txt size={14}>{p}  ↗</Txt></Pressable>)}
      </View>}/>
    <View style={{paddingHorizontal:19,paddingTop:10,paddingBottom:Math.max(insets.bottom,Platform.OS==='web'?34:10)+7,borderTopWidth:1,borderTopColor:C.border,flexDirection:rtl?'row-reverse':'row',alignItems:'center',gap:8}}>
      <TextInput value={input} onChangeText={setInput} placeholder={t.ask} placeholderTextColor={C.mutedForeground} multiline style={{flex:1,maxHeight:100,minHeight:49,borderRadius:16,backgroundColor:C.card,borderWidth:1,borderColor:C.border,color:C.foreground,paddingHorizontal:16,paddingVertical:13,fontFamily:'Inter_400Regular',textAlign:rtl?'right':'left'}}/>
      <Pressable accessibilityLabel={t.send} disabled={!input.trim()||ask.isPending} onPress={()=>send(input)} style={({pressed})=>({width:49,height:49,borderRadius:15,backgroundColor:C.primary,alignItems:'center',justifyContent:'center',opacity:!input.trim()||ask.isPending?.4:pressed?.7:1})}><Feather name="arrow-up" size={21} color={C.primaryForeground}/></Pressable>
    </View>
  </KeyboardAvoidingView>;
}