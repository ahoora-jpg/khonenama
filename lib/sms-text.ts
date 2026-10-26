const GSM_BASIC = new Set(Array.from('@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'));
const GSM_EXTENDED = new Set(Array.from('\f^{}\\[~]|€'));

export function estimateSms(text:string):{encoding:"gsm7"|"unicode";units:number;parts:number}{
  let units=0,unicode=false;
  for(const character of text){
    if(GSM_BASIC.has(character))units++;
    else if(GSM_EXTENDED.has(character))units+=2;
    else {unicode=true;break;}
  }
  if(unicode)units=text.length;
  const single=unicode?70:160,multiple=unicode?67:153;
  return {encoding:unicode?"unicode":"gsm7",units,parts:units===0?0:units<=single?1:Math.ceil(units/multiple)};
}
