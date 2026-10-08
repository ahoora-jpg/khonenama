import {BUSINESS_CATEGORIES} from "./business-taxonomy";
export const normalizeTopic=(value:string)=>value.replace(/ي/g,"ی").replace(/ك/g,"ک").replace(/\u200c/g," ").replace(/\s+/g," ").trim();
export const searchTopics=[...new Set([...BUSINESS_CATEGORIES.flatMap(c=>[c.label,...c.services]),"پرده","کفپوش","موکت","کاغذ دیواری","طراحی داخلی","خانه هوشمند"])];
const aliases:Record<string,string>={"مینیمال":"پرده مینیمال","میل پرده مینیمال":"میل‌پرده مینیمال","پرده مینیمال":"پرده مینیمال"};
export function canonicalSearchTopic(query:string){const normalized=normalizeTopic(query);return searchTopics.find(topic=>normalizeTopic(topic)===normalized)||aliases[normalized]||null;}
