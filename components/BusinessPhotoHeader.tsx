"use client";

import { Pencil, ImagePlus } from "lucide-react";

export default function BusinessPhotoHeader({ name, cover, logo, disabled = false, showInstallments = false, onEdit }: {
  name: string; cover?: string | null; logo?: string | null; disabled?: boolean; showInstallments?: boolean;
  onEdit?: (kind: "cover" | "logo") => void;
}) {
  const coverContent = cover ? <img className="profile-cover-image" src={cover} alt={"تصویر اصلی " + name} /> : <div className="profile-cover-shape" />;
  const logoContent = logo ? <img src={logo} alt={"پروفایل " + name} /> : <ImagePlus size={32} />;
  return <div className="business-photo-header">
    {onEdit ? <button className="profile-cover photo-edit-cover" type="button" disabled={disabled} onClick={() => onEdit("cover")} aria-label="تغییر تصویر پس‌زمینه">{coverContent}<span className="photo-edit-label"><Pencil size={18} /> {cover ? "ویرایش کاور" : "انتخاب کاور"}</span></button> : <div className="profile-cover">{coverContent}</div>}
    {showInstallments && <span className="business-installments-badge" title="طبق اعلام کسب‌وکار؛ شرایط اقساط را مستقیم هماهنگ کنید.">فروش اقساطی</span>}
    {onEdit ? <button className="business-photo-avatar" type="button" disabled={disabled} onClick={() => onEdit("logo")} aria-label="تغییر عکس پروفایل">{logoContent}<span><Pencil size={16} /> ویرایش</span></button> : logo ? <div className="business-photo-avatar">{logoContent}</div> : null}
  </div>;
}
