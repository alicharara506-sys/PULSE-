import React, { useRef, useState } from 'react';
import { Linking, Modal, Platform, ScrollView, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getLookupBarcodeQueryKey, useLookupBarcode } from '@workspace/api-client-react';
import { Button, C, Card, IconButton, Skeleton, Txt } from '@/components/Primitives';
import { useT } from '@/lib/pulse';

type LabelFood = {
  barcode: string; name: string; calories: number; protein: number; carbs: number; fat: number; portion: string;
};
const complete = (code: string) => /^\d{8}$|^\d{12,14}$/.test(code);
const usable = (food: LabelFood | undefined | null): food is LabelFood =>
  !!food && typeof food.name === 'string' && !!food.name.trim() &&
  typeof food.portion === 'string' && !!food.portion.trim() &&
  (['calories', 'protein', 'carbs', 'fat'] as const).every(k => typeof food[k] === 'number' && Number.isFinite(food[k]) && food[k] >= 0) &&
  (food.calories > 0 || food.protein > 0 || food.carbs > 0 || food.fat > 0);

export default function BarcodeSheet({ visible, onClose, onManual, onSelect, gentle }: {
  visible: boolean; onClose: () => void; onManual: () => void; onSelect: (food: LabelFood) => void; gentle: boolean;
}) {
  const { t, rtl } = useT();
  const [permission, requestPermission] = useCameraPermissions();
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const locked = useRef(false);
  const lookup = useLookupBarcode(submitted, {
    query: { queryKey: getLookupBarcodeQueryKey(submitted), enabled: visible && complete(submitted), retry: false },
  });
  const reset = () => { setInput(''); setSubmitted(''); setScanning(false); setCameraError(false); locked.current = false; };
  const close = () => { reset(); onClose(); };
  const manual = () => { reset(); onManual(); };
  const change = (value: string) => {
    const digits = value.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776)).replace(/\D/g, '').slice(0, 14);
    setInput(digits); setSubmitted(''); locked.current = false;
  };
  const submit = () => {
    if (!complete(input)) return;
    locked.current = true; setScanning(false); setSubmitted(input);
  };
  const scan = (code: string) => {
    if (locked.current || !complete(code)) return;
    locked.current = true; setInput(code); setSubmitted(code); setScanning(false);
  };
  const openCamera = async () => {
    if (Platform.OS === 'web') return;
    try {
      setCameraError(false);
      if (!permission?.granted) {
        const response = await requestPermission();
        if (!response.granted) return;
      }
      locked.current = false; setSubmitted(''); setScanning(true);
    } catch {
      setCameraError(true);
    }
  };
  const badFood = lookup.isSuccess && !usable(lookup.data);
  const food = lookup.isSuccess && usable(lookup.data) ? lookup.data : null;
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
    <ScrollView style={{ flex: 1, backgroundColor: C.background }} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: Platform.OS === 'web' ? 67 : 25, paddingBottom: 55, maxWidth: 600, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Txt display size={28}>{t.barcode}</Txt><IconButton icon="x" label={t.cancel} onPress={close}/>
      </View>
      <Txt size={13} color={C.mutedForeground} style={{ marginBottom: 22 }}>{t.barcodeIntro}</Txt>
      {Platform.OS !== 'web' && <>
        {scanning && permission?.granted
          ? <View style={{ height: 260, borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: C.primary }}>
              <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'itf14'] }} onBarcodeScanned={({ data }) => scan(data)}/>
              <View pointerEvents="none" style={{ position: 'absolute', left: 26, right: 26, top: 72, bottom: 72, borderWidth: 2, borderColor: C.primary, borderRadius: 10 }}/>
            </View>
          : <Card style={{ marginBottom: 16, alignItems: 'center', gap: 12 }}>
              <Txt size={13} color={C.mutedForeground} style={{ textAlign: 'center' }}>{cameraError ? t.barcodeDenied : permission?.granted ? t.barcodeAim : permission?.canAskAgain === false ? t.barcodeDenied : t.barcodePermission}</Txt>
              {permission?.canAskAgain === false && !permission.granted
                ? <Button label={t.openSettings} icon="settings" kind="secondary" onPress={() => Linking.openSettings().catch(() => {})}/>
                : <Button label={t.scanBarcode} icon="camera" onPress={openCamera}/>}
            </Card>}
        {scanning && <Button label={t.stopScan} kind="secondary" onPress={() => setScanning(false)} style={{ marginBottom: 16 }}/>}
      </>}
      <Txt size={12} bold color={C.mutedForeground} style={{ marginBottom: 8 }}>{t.barcodeEnter}</Txt>
      <TextInput value={input} onChangeText={change} onSubmitEditing={submit} maxLength={14} keyboardType="number-pad" returnKeyType="search" placeholder={t.barcodePlaceholder} placeholderTextColor={C.mutedForeground} style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 12, minHeight: 54, color: C.foreground, fontSize: 18, paddingHorizontal: 16, letterSpacing: 2, textAlign: rtl ? 'right' : 'left' }}/>
      {!!input && !complete(input) && <Txt size={12} color={C.mutedForeground} style={{ marginTop: 8 }}>{t.barcodeLength}</Txt>}
      <Button label={t.lookupBarcode} icon="search" onPress={submit} disabled={!complete(input) || lookup.isFetching} style={{ marginTop: 13 }}/>
      {lookup.isFetching && <View style={{ marginTop: 24 }}><Skeleton height={110}/><Txt color={C.primary} size={13}>{t.barcodeLoading}</Txt></View>}
      {submitted && !lookup.isFetching && (lookup.isError || badFood) && <Card style={{ marginTop: 22, borderColor: C.destructive }}>
        <Txt size={17} bold>{t.barcodeUnknown}</Txt>
        <Txt color={C.mutedForeground} size={13} style={{ marginTop: 7, marginBottom: 15 }}>{badFood ? t.barcodePartial : t.barcodeNoMatch}</Txt>
        <Button label={t.retry} kind="secondary" onPress={() => lookup.refetch()}/>
        <Button label={t.search} kind="ghost" onPress={manual} style={{ marginTop: 5 }}/>
      </Card>}
      {food && submitted === input && !lookup.isFetching && <Card style={{ marginTop: 22, backgroundColor: '#1A231A', borderColor: '#344825' }}>
        <Txt size={11} bold color={C.primary} style={{ letterSpacing: 1.5 }}>{t.barcodeLabel}</Txt>
        <Txt display size={22} style={{ marginTop: 8 }}>{food.name}</Txt>
        <Txt size={12} color={C.mutedForeground} style={{ marginTop: 4 }}>{food.portion} · {food.barcode}</Txt>
        <View style={{ height: 1, backgroundColor: C.border, marginVertical: 17 }}/>
        <Txt size={13}>{gentle ? '' : `${Math.round(food.calories)} ${t.kcal}   ·   `}{Math.round(food.protein)}g {t.protein}   ·   {Math.round(food.carbs)}g {t.carbs}   ·   {Math.round(food.fat)}g {t.fat}</Txt>
        <Button label={t.barcodeReview} icon="check" onPress={() => { onSelect(food); reset(); }} style={{ marginTop: 22 }}/>
      </Card>}
      <Button label={t.search} kind="ghost" onPress={manual} style={{ marginTop: 20 }}/>
    </ScrollView>
  </Modal>;
}