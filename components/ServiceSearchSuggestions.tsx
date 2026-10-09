import {BUSINESS_CATEGORIES} from "@/lib/business-taxonomy";
import {serviceCatalog} from "@/lib/service-catalog";
export default function ServiceSearchSuggestions(){
 const names=[...new Set([...BUSINESS_CATEGORIES.flatMap(category=>[category.label,...category.services]),...serviceCatalog.map(service=>service.name)])];
 return <datalist id="khonenama-service-search">{names.map(name=><option key={name} value={name}/>)}</datalist>;
}
