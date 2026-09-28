import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Polyline } from 'react-native-svg';
import colors from '@/constants/colors';
import { useT } from '@/lib/pulse';

export const C = colors.dark;
export function Txt({ children, size = 15, color = C.foreground, bold = false, display = false, style, lines }: {
  children: React.ReactNode; size?: number; color?: string; bold?: boolean; display?: boolean; style?: any; lines?: number;
}) {
  const { rtl } = useT();
  return <Text numberOfLines={lines} style={[{ color, fontSize:size, fontFamily:display ? 'SpaceGrotesk_700Bold' : bold ? 'Inter_600SemiBold' : 'Inter_400Regular', lineHeight:size * 1.35, textAlign:rtl ? 'right' : 'left', writingDirection:rtl ? 'rtl' : 'ltr' }, style]}>{children}</Text>;
}
export function Button({ label, onPress, icon, kind='primary', disabled=false, style, testID }: {
  label: string; onPress: () => void; icon?: React.ComponentProps<typeof Feather>['name'];
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger'; disabled?: boolean; style?: any; testID?:string;
}) {
  const { rtl } = useT();
  return <Pressable testID={testID} disabled={disabled} onPress={() => { Haptics.selectionAsync().catch(() => {}); onPress(); }} style={({ pressed }) => [s.button, kind === 'primary' ? s.primary : kind === 'secondary' ? s.secondary : kind === 'danger' ? s.danger : s.ghost, disabled && { opacity:.42 }, pressed && { opacity:.72, transform:[{scale:.98}] }, style]}>
    <View style={[s.row, rtl && { flexDirection:'row-reverse' }]}>{icon && <Feather name={icon} size={18} color={kind === 'primary' ? C.primaryForeground : kind === 'danger' ? C.destructive : C.foreground} />}<Txt size={14} bold color={kind === 'primary' ? C.primaryForeground : kind === 'danger' ? C.destructive : C.foreground}>{label}</Txt></View>
  </Pressable>;
}
export function IconButton({ icon, onPress, color=C.foreground, label }: { icon:React.ComponentProps<typeof Feather>['name']; onPress:()=>void; color?:string; label:string }) {
  return <Pressable accessibilityLabel={label} onPress={() => { Haptics.selectionAsync().catch(()=>{}); onPress(); }} style={({pressed}) => [{ minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center', opacity:pressed?.6:1 }]}><Feather name={icon} color={color} size={21}/></Pressable>;
}
export function Page({ children, title, subtitle, overline, right }: { children:React.ReactNode; title?:string; subtitle?:string; overline?:string; right?:React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { rtl } = useT();
  return <ScrollView style={{flex:1,backgroundColor:C.background}} contentContainerStyle={{paddingTop:Math.max(insets.top, Platform.OS === 'web' ? 67 : 14)+16,paddingHorizontal:22,paddingBottom:Platform.OS === 'web' ? 120 : 105, maxWidth:600,width:'100%',alignSelf:'center'}} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    {(title || overline) && <View style={{marginBottom:27}}>
      {overline && <Txt color={C.primary} size={11} bold style={{letterSpacing:2,marginBottom:9}}>{overline}</Txt>}
      <View style={[{flexDirection:'row', alignItems:'center',justifyContent:'space-between',gap:8},rtl && {flexDirection:'row-reverse'}]}><Txt display size={30} style={{flex:1,letterSpacing:-1}}>{title}</Txt>{right}</View>
      {subtitle && <Txt color={C.mutedForeground} size={14} style={{marginTop:7}}>{subtitle}</Txt>}
    </View>}
    {children}
  </ScrollView>;
}
export function Card({ children, style }: {children:React.ReactNode; style?:any}) { return <View style={[s.card,style]}>{children}</View>; }
export function Section({ title, right, style }: {title:string; right?:React.ReactNode; style?:any}) {
  const {rtl}=useT(); return <View style={[{flexDirection:rtl?'row-reverse':'row',justifyContent:'space-between',alignItems:'center',marginTop:30,marginBottom:13},style]}><Txt size={11} bold color={C.mutedForeground} style={{letterSpacing:1.8}}>{title}</Txt>{right}</View>;
}
export function Field({label,value,onChangeText,placeholder,keyboardType='default',multiline=false}:{
  label:string;value:string;onChangeText:(v:string)=>void;placeholder?:string;keyboardType?:'default'|'numeric'|'decimal-pad';multiline?:boolean;
}) {
  const {rtl}=useT(); return <View style={{marginBottom:16}}><Txt size={12} bold color={C.mutedForeground} style={{marginBottom:8}}>{label}</Txt><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.mutedForeground} keyboardType={keyboardType} multiline={multiline} style={[s.input,{textAlign:rtl?'right':'left',minHeight:multiline?90:50, textAlignVertical:multiline?'top':'center'}]}/></View>;
}
export function Chips<T extends string>({values,value,onChange,labels}: {values:T[];value:T;onChange:(v:T)=>void;labels:(v:T)=>string}) {
  const {rtl}=useT(); return <View style={{flexDirection:rtl?'row-reverse':'row',flexWrap:'wrap',gap:8}}>{values.map(v=><Pressable key={v} onPress={()=>onChange(v)} style={({pressed})=>[{borderWidth:1,borderColor:v===value?C.primary:C.border,backgroundColor:v===value?'#28331A':C.card,borderRadius:100,minHeight:44,paddingHorizontal:16,alignItems:'center',justifyContent:'center',opacity:pressed?.7:1}]}><Txt size={13} bold={v===value} color={v===value?C.primary:C.foreground}>{labels(v)}</Txt></Pressable>)}</View>;
}
export function Empty({icon,title,detail}: {icon:React.ComponentProps<typeof Feather>['name'];title:string;detail?:string}) {
  return <View style={{alignItems:'center',paddingVertical:32,paddingHorizontal:20,gap:12}}><View style={{width:54,height:54,borderRadius:20,backgroundColor:C.secondary,alignItems:'center',justifyContent:'center'}}><Feather name={icon} size={24} color={C.primary}/></View><Txt size={15} bold style={{textAlign:'center'}}>{title}</Txt>{detail && <Txt size={13} color={C.mutedForeground} style={{textAlign:'center'}}>{detail}</Txt>}</View>;
}
export function Skeleton({height=110}: {height?:number}) {return <View style={{height,borderRadius:16,backgroundColor:C.card,marginBottom:12,opacity:.75}}/>;}
export function Beat({width=90}: {width?:number}) {return <Svg width={width} height={24} viewBox="0 0 100 24"><Polyline points="0,13 28,13 34,9 39,18 46,2 53,22 60,13 100,13" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;}
export function Ring({progress,size=180,children}: {progress:number;size?:number;children:React.ReactNode}) {
  const r=(size-18)/2; return <View style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}><Svg width={size} height={size} style={{position:'absolute',transform:[{rotate:'-90deg'}]}}><Circle cx={size/2} cy={size/2} r={r} stroke={C.border} strokeWidth={11} fill="none"/><Circle cx={size/2} cy={size/2} r={r} stroke={C.primary} strokeWidth={11} fill="none" strokeLinecap="round" strokeDasharray={`${2*Math.PI*r}`} strokeDashoffset={2*Math.PI*r*(1-Math.min(1,Math.max(0,progress)))}/></Svg>{children}</View>;
}
export function Macro({name,value,target,color}: {name:string;value:number;target:number;color:string}) {return <View style={{flex:1,gap:6}}><View style={{height:4,backgroundColor:C.border,borderRadius:4,overflow:'hidden'}}><View style={{height:4,width:`${Math.min(100,target?value/target*100:0)}%`,backgroundColor:color,borderRadius:4}}/></View><Txt size={12} color={C.mutedForeground}>{name}</Txt><Txt size={15} bold>{Math.round(value)}<Txt size={11} color={C.mutedForeground}> / {target}g</Txt></Txt></View>;}
const s=StyleSheet.create({row:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9},button:{minHeight:50,borderRadius:14,alignItems:'center',justifyContent:'center',paddingHorizontal:18},primary:{backgroundColor:C.primary},secondary:{backgroundColor:C.secondary,borderWidth:1,borderColor:C.border},ghost:{backgroundColor:'transparent'},danger:{backgroundColor:C.card,borderWidth:1,borderColor:C.destructive},card:{backgroundColor:C.card,borderRadius:16,borderWidth:1,borderColor:C.border,padding:18},input:{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:12,color:C.foreground,paddingHorizontal:15,paddingVertical:12,fontFamily:'Inter_400Regular',fontSize:15}});