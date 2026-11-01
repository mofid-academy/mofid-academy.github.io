import {esc} from './shared.mjs?v=20261031.3-instructor';

export function responseActions(row){
  const id=esc(row.id),name=esc(row.organizational_name||'این پاسخ');
  return '<div class="response-actions"><button type="button" class="button text" data-detail="'+id+'" aria-label="جزئیات پاسخ '+name+'">جزئیات</button><button type="button" class="button danger delete-response" data-delete-response="'+id+'" aria-label="حذف پاسخ '+name+'">حذف پاسخ</button></div>';
}

export function bindResponseActions(root,{onDetail,onDelete}){
  root.querySelectorAll('[data-detail]').forEach(button=>{button.onclick=()=>onDetail(button.dataset.detail);});
  root.querySelectorAll('[data-delete-response]').forEach(button=>{button.onclick=()=>onDelete(button.dataset.deleteResponse);});
}
