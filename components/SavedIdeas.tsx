"use client";

import { Bookmark, Copy, Search, Share2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { IDEA_BOARD_TITLE_KEY, readIdeaBoard, type SavedIdea, writeIdeaBoard } from "@/components/idea-board";

const defaultTitle = "ایده‌های من";

export default function SavedIdeas() {
  const [items, setItems] = useState<SavedIdea[]>([]);
  const [title, setTitle] = useState(defaultTitle);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setItems(readIdeaBoard());
    setTitle(localStorage.getItem(IDEA_BOARD_TITLE_KEY) || defaultTitle);
  }, []);

  function saveTitle(value: string) {
    const next = value.trim() || defaultTitle;
    setTitle(next);
    localStorage.setItem(IDEA_BOARD_TITLE_KEY, next);
  }

  function remove(id: string) {
    const next = items.filter((item) => item.id !== id);
    writeIdeaBoard(next);
    setItems(next);
  }

  async function share() {
    if (!items.length) return;
    const text = `برد «${title}» در خونه‌نما\n` + items.map((item) => `• ${item.title}: https://khonenama.ir${item.href}`).join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title, text });
        setMessage("برد برای اشتراک‌گذاری آماده شد.");
      } else {
        await navigator.clipboard.writeText(text);
        setMessage("لینک‌های برد کپی شد؛ آن را برای متخصص بفرست.");
      }
    } catch {
      setMessage("اشتراک‌گذاری انجام نشد.");
    }
  }

  return <section className="saved-ideas" aria-labelledby="saved-ideas-title">
    <div className="saved-ideas-heading"><div><span className="section-kicker">برد انتخاب شما</span><h1 id="saved-ideas-title">{title}</h1><p>ایده‌هایی که ذخیره می‌کنی فقط در همین مرورگر نگهداری می‌شوند. نام برد را برای پروژه‌ات تغییر بده و سپس آن را برای متخصص بفرست.</p></div><a className="pill-button dark" href="/ideas"><Bookmark size={17} /> دیدن ایده‌ها</a></div>
    <label className="idea-board-title"><span>نام پروژه یا برد</span><input value={title} maxLength={70} onChange={(event) => setTitle(event.target.value)} onBlur={(event) => saveTitle(event.target.value)} placeholder={defaultTitle} /></label>
    {items.length ? <>
      <div className="saved-ideas-actions"><button className="pill-button dark" type="button" onClick={() => void share()}><Share2 size={17} /> ارسال برای متخصص</button><a className="pill-button" href="/search"><Search size={17} /> یافتن متخصص</a></div>
      <p className="saved-ideas-note" role="status">{message}</p>
      <div className="saved-ideas-grid">{items.map((item) => <article className="saved-idea-card glass-panel" key={item.id}><img src={item.img} alt={item.title} width={1200} height={675} loading="lazy" decoding="async" /><div><small>{item.category}</small><h2>{item.title}</h2><div className="saved-idea-links"><a href={item.href}>دیدن دسته مرتبط</a><button type="button" onClick={() => remove(item.id)}><Trash2 size={16} /> حذف</button></div></div></article>)}</div>
    </> : <div className="saved-ideas-empty glass-panel"><Copy size={30} /><h2>هنوز ایده‌ای ذخیره نکرده‌ای.</h2><p>از گالری ایده‌ها، هر تصویری که به انتخابت کمک می‌کند ذخیره کن؛ بعد آن را با متخصص مرتبط در میان بگذار.</p><a className="pill-button dark" href="/ideas">شروع دیدن ایده‌ها</a></div>}
  </section>;
}
