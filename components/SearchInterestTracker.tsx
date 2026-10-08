"use client";
import {useEffect} from "react";
import {canonicalSearchTopic} from "@/lib/search-topics";
export default function SearchInterestTracker({query,hasResults}:{query:string;hasResults:boolean}){
 useEffect(()=>{const topic=canonicalSearchTopic(query);if(!topic)return;const key="khonenama-search-topic:"+topic+":"+hasResults;try{const last=Number(sessionStorage.getItem(key)||0);if(Date.now()-last<60000)return;sessionStorage.setItem(key,String(Date.now()));}catch{/* Analytics remain optional. */}void fetch("/api/search-interest",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic,hasResults}),keepalive:true}).catch(()=>{});},[query,hasResults]);
 return null;
}
