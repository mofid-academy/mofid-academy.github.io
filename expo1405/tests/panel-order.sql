-- Only synthetic panel order is changed; all test data rolls back.
begin;
set local role service_role;
do $$
declare a text; b text; c text; before_order text[]; desired text[]; result jsonb; rejected boolean;
begin
 a=public.expo1405_create_class('main','Order fixture A',false,false,gen_random_uuid())->>'id';
 b=public.expo1405_create_class(a,'Order fixture B',false,false,gen_random_uuid())->>'id';
 c=public.expo1405_create_class(a,'Order fixture C',false,false,gen_random_uuid())->>'id';
 if (select next_room_id from public.expo1405_rooms where id=a) is not null then raise exception 'Ordinary creation pinned automatic order';end if;
 perform public.expo1405_host_action(b,jsonb_build_object('action','save','text','Synthetic order B question','options',jsonb_build_array('One','Two')));
 perform public.expo1405_host_action(c,jsonb_build_object('action','save','text','Synthetic order C question','options',jsonb_build_array('One','Two')));
 if public.expo1405_resolve_next_panel(a)->>'id' is distinct from b then raise exception 'Initial automatic next incorrect';end if;
 select array_agg(id order by sort_order,created_at,id) into before_order from public.expo1405_rooms where (id='main' or parent_id='main') and deleted_at is null;
 desired=array_replace(array_replace(array_replace(before_order,b,'SWAP'),c,b),'SWAP',c);
 result=public.expo1405_reorder_classes(desired,before_order);
 if result->>'ok'<>'true' then raise exception 'Order not saved';end if;
 if public.expo1405_resolve_next_panel(a)->>'id' is distinct from c then raise exception 'Automatic next ignored execution order';end if;
 -- A retry must not undo or repeat the move.
 perform public.expo1405_reorder_classes(desired,before_order);
 if (select array_agg(id order by sort_order,created_at,id) from public.expo1405_rooms where (id='main' or parent_id='main') and deleted_at is null) is distinct from desired then raise exception 'Retry changed order';end if;
 rejected=false;begin perform public.expo1405_reorder_classes(before_order,before_order);exception when others then if sqlerrm='class_order_changed' then rejected=true;else raise;end if;end;
 if not rejected then raise exception 'Stale order overwrote newer order';end if;
 rejected=false;begin perform public.expo1405_reorder_classes(desired||a,desired);exception when others then if sqlerrm='invalid_class_order' then rejected=true;else raise;end if;end;
 if not rejected then raise exception 'Duplicate/missing panel accepted';end if;
 perform public.expo1405_set_next_panel(a,b);
 perform public.expo1405_reorder_classes(before_order,desired);
 if public.expo1405_resolve_next_panel(a)->>'id' is distinct from b then raise exception 'Explicit next destination changed';end if;
 if (select phase from public.expo1405_rooms where id=a)<>'waiting' or (select count(*) from public.expo1405_participants where room_id in(a,b,c))<>0 then raise exception 'Ordering changed activity';end if;
 if has_function_privilege('anon','public.expo1405_reorder_classes(text[],text[])','execute') or has_function_privilege('authenticated','public.expo1405_reorder_classes(text[],text[])','execute') then raise exception 'Public ordering access';end if;
end $$;
rollback;
