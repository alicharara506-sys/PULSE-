import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, TextInput, View, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAnalyzeMeal } from '@workspace/api-client-react';
import { router } from 'expo-router';
import BarcodeSheet from '@/components/BarcodeSheet';
import { Button, C, Card, Chips, Empty, Field, IconButton, Page, Section, Skeleton, Txt } from '@/components/Primitives';
import { foods, Food } from '@/lib/catalog';
import { dateKey, Meal, MealType, previousDate, uid, usePulse, useT } from '@/lib/pulse';

const types: MealType[]=['breakfast','lunch','dinner','snack'];
type Draft = Omit<Meal,'id'|'date'>;
const newDraft=():Draft=>({type:'lunch',source:'manual',name:'',portion:'1 serving',calories:0,protein:0,carbs:0,fat:0});
export default function Log() {
  const {meals,addMeal,editMeal,deleteMeal,profile}=usePulse();
  const {t,language,rtl}=useT();
  const analyze=useAnalyzeMeal();
  const [mode,setMode]=useState<'none'|'search'|'edit'|'barcode'>('none');
  const [query,setQuery]=useState('');
  const [draft,setDraft]=useState<Draft>(newDraft());
  const [editingId,setEditingId]=useState<string|null>(null);
  const [scale,setScale]=useState(1);
  const [error,setError]=useState('');
  const [photo,setPhoto]=useState<{uri:string;base64:string;mime:string}|null>(null);
  const [confirmDelete,setConfirmDelete]=useState<string|null>(null);
  const today=meals.filter(m=>m.date===dateKey());
  const yesterday=meals.filter(m=>m.date===previousDate());
  const frequent=Object.values(meals.reduce<Record<string,{meal:Meal,count:number}>>((acc,m)=>{const k=m.name.toLowerCase();acc[k]??={meal:m,count:0};acc[k].count++;return acc;},{})).filter(x=>x.count>=2).sort((a,b)=>b.count-a.count).slice(0,4);
  const pick=async(camera:boolean)=>{
    setError('');setMode('none');
    try {
      const permission=camera?await ImagePicker.requestCameraPermissionsAsync():await ImagePicker.requestMediaLibraryPermissionsAsync();
      if(!permission.granted){setError(t.permission);return;}
      const result=camera?await ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:.72,base64:true}):await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:.72,base64:true});
      if(result.canceled||!result.assets[0])return;
      const asset=result.assets[0];
      if(!asset.base64){setError(t.photoNeed);return;}
      const selected={uri:asset.uri,base64:asset.base64,mime:asset.mimeType||'image/jpeg'};
      setPhoto(selected);
      await runAnalyze(selected);
    } catch {setError(t.failed);}
  };
  const runAnalyze=async(image:{uri:string;base64:string;mime:string})=>{
    setError('');
    try {
      const data=await analyze.mutateAsync({data:{imageBase64:image.base64,imageMimeType:image.mime,language}});
      setDraft({type:'lunch',source:'photo',name:data.name,photoUri:image.uri,portion:data.portion||'1 serving',calories:data.calories,protein:data.protein,carbs:data.carbs,fat:data.fat,confidence:data.confidence});
      setEditingId(null);setScale(1);setMode('edit');
    } catch {setError(t.failed);}
  };
  const fromFood=(food:Food)=>{
    setDraft({type:'lunch',source:'manual',name:language==='ar'?food.ar:food.name,portion:food.portion,calories:food.calories,protein:food.protein,carbs:food.carbs,fat:food.fat});setScale(1);setEditingId(null);setMode('edit');
  };
  const openMeal=(meal:Meal)=>{
    const {id,date,...rest}=meal;setDraft(rest);setEditingId(id);setScale(1);setMode('edit');
  };
  const save=()=>{
    if(!draft.name.trim()||!draft.portion.trim()||!['calories','protein','carbs','fat'].every(k=>Number.isFinite(draft[k as keyof Pick<Meal,'calories'|'protein'|'carbs'|'fat'>])&&Number(draft[k as keyof Pick<Meal,'calories'|'protein'|'carbs'|'fat'>])>=0)){setError(t.validation);return;}
    const meal:Meal={...draft,id:editingId||uid(),date:dateKey(),name:draft.name.trim(),calories:Math.round(draft.calories*scale),protein:Math.round(draft.protein*scale),carbs:Math.round(draft.carbs*scale),fat:Math.round(draft.fat*scale)};
    if(editingId)editMeal(meal);else addMeal(meal);
    setMode('none');setPhoto(null);setError('');setEditingId(null);
  };
  const number=(key:'calories'|'protein'|'carbs'|'fat',v:string)=>setDraft(d=>({...d,[key]:v===''?NaN:Number(v)/scale}));
  const clone=(m:Meal)=>addMeal({...m,id:uid(),date:dateKey(),source:'copy'});
  return <Page overline={t.today} title={t.myDay} subtitle={t.logSub}>
    {!profile&&<Card style={{marginBottom:16,backgroundColor:'#1C2817',borderColor:'#344825'}}><Txt color={C.primary} bold>{t.noAccount}</Txt><Txt size={12} color={C.mutedForeground} style={{marginTop:5}}>{t.nudge}</Txt><Button label={t.back} kind="secondary" onPress={()=>router.replace('/')} style={{marginTop:12}}/></Card>}
    <Card style={{padding:20,backgroundColor:'#1A231A',borderColor:'#344825'}}>
      <View style={{flexDirection:rtl?'row-reverse':'row',alignItems:'center',justifyContent:'space-between',marginBottom:16}}><Txt size={11} bold color={C.primary} style={{letterSpacing:1.8}}>{t.photo}</Txt><Feather name="aperture" size={19} color={C.primary}/></View>
      <Txt display size={22} style={{marginBottom:17}}>{t.snap}</Txt>
      <View style={{flexDirection:rtl?'row-reverse':'row',gap:9}}><Button label={t.camera} icon="camera" onPress={()=>pick(true)} style={{flex:1}}/><Button label={t.library} icon="image" kind="secondary" onPress={()=>pick(false)} style={{flex:1}}/></View>
    </Card>
    {analyze.isPending&&<View style={{marginTop:14}}><Skeleton height={115}/><Txt color={C.primary} size={13}>{t.analyzing}</Txt></View>}
    {!!error&&mode==='none'&&<Card style={{marginTop:13}}><Txt color={C.destructive} size={13}>{error}</Txt>{photo&&<Button label={t.retry} onPress={()=>runAnalyze(photo)} kind="secondary" style={{marginTop:12}}/>}</Card>}
    <Section title={t.manual}/>
    <View style={{flexDirection:rtl?'row-reverse':'row',gap:9}}>
      <Button label={t.search} icon="search" kind="secondary" onPress={()=>{setQuery('');setMode('search');setError('')}} style={{flex:1}}/>
      <Button label={t.custom} icon="plus" kind="secondary" onPress={()=>{setDraft(newDraft());setScale(1);setEditingId(null);setMode('edit');setError('')}} style={{flex:1}}/>
    </View>
    <Pressable onPress={()=>{setMode('barcode');setError('')}} style={{minHeight:48,justifyContent:'center',alignItems:'center',marginTop:9,flexDirection:rtl?'row-reverse':'row',gap:8}}><Feather name="maximize" color={C.primary} size={16}/><Txt color={C.primary} size={13} bold>{t.barcode}</Txt></Pressable>
    {frequent.length>0&&<><Section title={t.recent}/>{frequent.map(({meal})=><MealRow key={meal.name} meal={meal} onPress={()=>openMeal(meal)} action={()=>clone(meal)} actionLabel={t.add} gentle={!!profile?.gentle}/>)}</>}
    <Section title={t.diary} right={<Txt color={C.mutedForeground} size={12}>{today.length} {t.meals}</Txt>}/>
    {today.length===0?<Card><Empty icon="book-open" title={t.diaryEmpty}/></Card>:types.map(type=>{
      const list=today.filter(m=>m.type===type);if(!list.length)return null;
      return <View key={type}><Txt size={12} bold color={C.mutedForeground} style={{marginBottom:9,marginTop:10}}>{t[type].toUpperCase()}</Txt>{list.map(m=><MealRow key={m.id} meal={m} onPress={()=>openMeal(m)} action={()=>setConfirmDelete(m.id)} actionLabel={t.delete} gentle={!!profile?.gentle} danger/>)}</View>;
    })}
    <Section title={t.yesterday}/>
    {yesterday.length?<>{yesterday.map(m=><MealRow key={m.id} meal={m} onPress={()=>clone(m)} action={()=>clone(m)} actionLabel={t.copy} gentle={!!profile?.gentle}/>)}<Button label={t.copy} kind="secondary" onPress={()=>yesterday.forEach(clone)} style={{marginTop:6}}/></>:<Txt size={13} color={C.mutedForeground}>{t.noYesterday}</Txt>}
    <Modal visible={mode==='search'} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setMode('none')}>
      <View style={{flex:1,backgroundColor:C.background,paddingTop:Platform.OS==='web'?67:25,paddingHorizontal:22}}>
        <View style={{flexDirection:rtl?'row-reverse':'row',alignItems:'center',justifyContent:'space-between'}}><Txt display size={27}>{t.search}</Txt><IconButton icon="x" label={t.cancel} onPress={()=>setMode('none')}/></View>
        <Field label={t.searchHint} value={query} onChangeText={setQuery} placeholder={t.searchHint}/>
        <Txt size={11} color={C.mutedForeground} style={{marginBottom:14}}>{t.manual} · {t.customHint}</Txt>
        <ScrollView keyboardShouldPersistTaps="handled">{foods.filter(f=>`${f.name} ${f.ar}`.toLowerCase().includes(query.toLowerCase())).map(f=><Pressable key={f.name} onPress={()=>fromFood(f)} style={{paddingVertical:15,borderBottomColor:C.border,borderBottomWidth:1,minHeight:60,flexDirection:rtl?'row-reverse':'row',alignItems:'center',gap:12}}><View style={{flex:1}}><Txt bold>{language==='ar'?f.ar:f.name}</Txt><Txt size={12} color={C.mutedForeground}>{f.portion} · {f.protein}g {t.protein}</Txt></View>{!profile?.gentle&&<Txt color={C.primary}>{f.calories} {t.kcal}</Txt>}</Pressable>)}
        {!foods.some(f=>`${f.name} ${f.ar}`.toLowerCase().includes(query.toLowerCase()))&&<Empty icon="search" title={t.noResults}/>}</ScrollView>
        <Button label={t.custom} icon="plus" kind="secondary" onPress={()=>{setDraft({...newDraft(),name:query});setScale(1);setEditingId(null);setMode('edit')}} style={{marginBottom:25}}/>
      </View>
    </Modal>
    <BarcodeSheet visible={mode==='barcode'} gentle={!!profile?.gentle} onClose={()=>setMode('none')} onManual={()=>{setQuery('');setMode('search')}} onSelect={food=>{
      setDraft({type:'lunch',source:'barcode',name:food.name,portion:food.portion,calories:food.calories,protein:food.protein,carbs:food.carbs,fat:food.fat});
      setScale(1);setEditingId(null);setError('');setMode('edit');
    }}/>
    <Modal visible={mode==='edit'} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setMode('none')}>
      <ScrollView style={{flex:1,backgroundColor:C.background}} contentContainerStyle={{paddingTop:Platform.OS==='web'?67:25,paddingHorizontal:22,paddingBottom:60,maxWidth:600,width:'100%',alignSelf:'center'}} keyboardShouldPersistTaps="handled">
        <View style={{flexDirection:rtl?'row-reverse':'row',justifyContent:'space-between',alignItems:'center',marginBottom:15}}><Txt display size={28}>{editingId?t.edit:t.review}</Txt><IconButton icon="x" label={t.cancel} onPress={()=>setMode('none')}/></View>
        {draft.photoUri&&<Image source={{uri:draft.photoUri}} style={{height:180,width:'100%',borderRadius:16,marginBottom:19}} resizeMode="cover"/>}
        {draft.source==='photo'&&<Card style={{marginBottom:17,backgroundColor:'#1C2817',borderColor:'#344825'}}><Txt size={12} color={C.primary}>{t.estimated}</Txt><Txt size={12} color={C.mutedForeground} style={{marginTop:4}}>{t.confidence}: {draft.confidence}{draft.confidence==='low'?` · ${t.uncertain}`:''}</Txt></Card>}
        <Field label={t.mealName} value={draft.name} onChangeText={v=>setDraft(d=>({...d,name:v}))} placeholder={t.mealName}/>
        <Txt size={12} bold color={C.mutedForeground} style={{marginBottom:9}}>{t.mealType}</Txt><Chips values={types} value={draft.type} onChange={v=>setDraft(d=>({...d,type:v}))} labels={v=>t[v]}/>
        <View style={{height:22}}/><Field label={t.portions} value={draft.portion} onChangeText={v=>setDraft(d=>({...d,portion:v}))}/>
        <View style={{flexDirection:rtl?'row-reverse':'row',alignItems:'center',justifyContent:'space-between',marginBottom:17}}><Txt bold>{t.adjust}</Txt><View style={{flexDirection:'row',alignItems:'center',gap:4}}><IconButton icon="minus" label={t.minus} onPress={()=>setScale(v=>Math.max(.25,Math.round((v-.25)*100)/100))}/><Txt bold color={C.primary}>{scale.toFixed(2)}×</Txt><IconButton icon="plus" label={t.plus} onPress={()=>setScale(v=>Math.min(4,Math.round((v+.25)*100)/100))}/></View></View>
        <View style={{flexDirection:rtl?'row-reverse':'row',flexWrap:'wrap',gap:10}}>{(['calories','protein','carbs','fat'] as const).map(key=><View key={key} style={{width:'47%'}}><Txt size={12} color={C.mutedForeground} style={{marginBottom:7}}>{key==='calories'?t.kcal:t[key]}</Txt><TextInput value={Number.isNaN(draft[key])?'':String(Math.round(draft[key]*scale))} onChangeText={v=>number(key,v)} keyboardType="decimal-pad" style={{height:51,backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:12,paddingHorizontal:15,color:C.foreground,fontSize:17}}/></View>)}</View>
        {!!error&&<Txt color={C.destructive} size={12} style={{marginTop:15}}>{error}</Txt>}
        <Button label={t.confirm} icon="check" onPress={save} style={{marginTop:27}}/>
        {editingId&&<Button label={t.delete} kind="danger" onPress={()=>{setMode('none');setConfirmDelete(editingId)}} style={{marginTop:10}}/>}
      </ScrollView>
    </Modal>
    <Modal visible={!!confirmDelete} transparent animationType="fade" onRequestClose={()=>setConfirmDelete(null)}><View style={{flex:1,backgroundColor:'#07090CEB',justifyContent:'center',padding:24}}><Card><Txt display size={24}>{t.deleteAsk}</Txt><Txt color={C.mutedForeground} style={{marginVertical:12}}>{t.deleteBody}</Txt><Button label={t.delete} kind="danger" onPress={()=>{if(confirmDelete)deleteMeal(confirmDelete);setConfirmDelete(null)}}/><Button label={t.cancel} kind="ghost" onPress={()=>setConfirmDelete(null)}/></Card></View></Modal>
  </Page>;
}
function MealRow({meal,onPress,action,actionLabel,gentle,danger=false}:{meal:Meal;onPress:()=>void;action:()=>void;actionLabel:string;gentle:boolean;danger?:boolean}){
  const {t,rtl}=useT();
  return <Card style={{padding:10,marginBottom:9,flexDirection:rtl?'row-reverse':'row',alignItems:'center',gap:10}}>
    <Pressable onPress={onPress} style={{flex:1,flexDirection:rtl?'row-reverse':'row',alignItems:'center',gap:11,minHeight:54}}>
      {meal.photoUri?<Image source={{uri:meal.photoUri}} style={{height:51,width:51,borderRadius:10}}/>:<View style={{height:51,width:51,borderRadius:10,backgroundColor:C.secondary,alignItems:'center',justifyContent:'center'}}><Feather name="coffee" color={C.primary} size={19}/></View>}
      <View style={{flex:1}}><Txt size={14} bold lines={1}>{meal.name}</Txt><Txt size={11} color={C.mutedForeground}>{t[meal.type]} · {meal.portion}{gentle?'':` · ${meal.calories} ${t.kcal}`}</Txt></View>
    </Pressable><IconButton icon={danger?'trash-2':'plus'} color={danger?C.destructive:C.primary} label={actionLabel} onPress={action}/>
  </Card>;
}