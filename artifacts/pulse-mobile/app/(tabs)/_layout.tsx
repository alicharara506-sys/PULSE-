import React from 'react';
import { Platform, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/components/Primitives';
import { usePulse, useT } from '@/lib/pulse';

export default function TabLayout() {
  const {profile}=usePulse();
  const {t}=useT();
  const insets=useSafeAreaInsets();
  const items=[
    {name:'index',title:t.home,icon:'home'},
    {name:'log',title:t.log,icon:'plus-circle'},
    {name:'plan',title:t.plan,icon:'calendar'},
    {name:'coach',title:t.coach,icon:'message-circle'},
    {name:'profile',title:t.profile,icon:'user'},
  ] as const;
  return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:C.primary,tabBarInactiveTintColor:C.mutedForeground,
    tabBarLabelStyle:{fontFamily:'Inter_600SemiBold',fontSize:10,marginTop:1},
    tabBarStyle:{display:profile? 'flex':'none',height:Platform.OS==='web'?84:58+insets.bottom,paddingBottom:Platform.OS==='web'?24:insets.bottom,paddingTop:7,backgroundColor:C.card,borderTopColor:C.border,borderTopWidth:1,elevation:0},
    tabBarBackground:()=>Platform.OS==='web'?<View style={{flex:1,backgroundColor:C.card}}/>:null,
  }}>{items.map(item=><Tabs.Screen key={item.name} name={item.name} options={{title:item.title,tabBarIcon:({color})=><Feather name={item.icon} size={20} color={color}/>}}/>)}</Tabs>;
}