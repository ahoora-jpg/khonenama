export function moneyDigits(value:string){return value.replace(/[۰-۹]/g,c=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٠-٩]/g,c=>String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/\D/g,"").replace(/^0+(?=\d)/,"").slice(0,13);}
export function formatMoneyInput(value:string){return moneyDigits(value).replace(/\B(?=(\d{3})+(?!\d))/g,",");}
