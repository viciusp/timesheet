/* Fictional demo records only. This adapter never connects to Supabase. */
(function(){
 const STORE='warren-electric-office-demo-v1';
 const date=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const plus=(d,n)=>{const v=new Date(d);v.setDate(v.getDate()+n);return v};
 const today=new Date();today.setHours(12,0,0,0);
 const week=d=>{const v=new Date(d);v.setDate(v.getDate()-((v.getDay()-4+7)%7));return v};
 const current=week(today),previous=plus(current,-7);
 const stamp=n=>plus(today,n).toISOString();
 const names=['Wattson Holmes','Anita Breaker','Doug Trench','Penny Conduit','Ohm Sweetohm','Justin Time','Betty Grounded','Chip Circuit','Meg A. Watt','Sparky McSparkface','Phil A. Panel','Terry Terminal','Gus Fuse','Wendy Wire','Al Luminum','Polly Phase','Rick O. Shay','Frank N. Switch'];
 function seed(){
 const db={profiles:[],timesheets:[],timesheet_entries:[],vacation_requests:[],audit_log:[]};
 db.profiles.push({id:'demo-manager',full_name:'Connie Circuit',username:'connie',email:'connie.circuit@example.invalid',phone:'555-010-0000',role:'manager',status:'active',company_role:'master_electrician',created_at:stamp(-400)});
 names.forEach((name,i)=>{db.profiles.push({id:'demo-worker-'+i,full_name:name,username:name.toLowerCase().replace(/[^a-z]/g,''),email:'worker'+(i+1)+'@example.invalid',phone:'555-010-'+String(i+1).padStart(4,'0'),role:'worker',status:i<14?'active':i<17?'pending':'inactive',company_role:['apprentice','journeyman','master_electrician'][i%3],created_at:stamp(-180+i*7),hire_date:date(plus(today,-900+i*43)),annual_vacation_days:i===13?null:[10,15,20][i%3]});});
 const jobs=[['5401','Library lighting upgrade'],['5312','Bakery panel replacement'],['5520','Community center wiring'],['5608','School service call']];
 function sheet(i,w,status,hours,correction){
 const id='demo-ts-'+i+'-'+date(w),rows=[];
 const days=[0,1,4,5,6];let remaining=hours;
 days.forEach((d,j)=>{const n=j===4?remaining:Math.min(remaining,hours>40?9:8);if(n<=0)return;remaining-=n;rows.push({id:id+'-'+d,timesheet_id:id,day_index:d,job_code:jobs[(i+j)%4][0],description:jobs[(i+j)%4][1],hours:n});});
 db.timesheet_entries.push(...rows);db.timesheets.push({id,user_id:'demo-worker-'+i,week_start:date(w),week_end:date(plus(w,6)),total_hours:hours,status,notes:i===3?'Saturday emergency call included in weekly total.':'Demo crew notes: '+jobs[i%4][1],created_at:stamp(-3),submitted_at:status==='draft'?null:stamp(-1),correction_note:correction||null,returned_at:correction?stamp(-1):null});
 }
 for(let i=0;i<14;i++){
 sheet(i,previous,'approved',i%4===0?45:40);
 if(i<12)sheet(i,current,i<4?'approved':i<8?'submitted':'draft',i<8?(i===3?46:40):i===8?16:24,i===10?'Please check Monday: job code should match the library project.':null);
 }
 // Give one employee split jobs on a single day and another weekend work.
 const t=db.timesheets.find(t=>t.user_id==='demo-worker-2'&&t.week_start===date(current));
 const row=db.timesheet_entries.find(e=>e.timesheet_id===t.id&&e.day_index===0);row.hours=4;db.timesheet_entries.push({...row,id:row.id+'-split',job_code:'5608',description:'Afternoon service call',hours:4});
 const overtime=db.timesheets.find(t=>t.user_id==='demo-worker-3'&&t.week_start===date(current));
 const sat=db.timesheet_entries.find(e=>e.timesheet_id===overtime.id&&e.day_index===6);sat.hours-=4;db.timesheet_entries.push({id:overtime.id+'-sat',timesheet_id:overtime.id,day_index:2,job_code:'5608',description:'Saturday emergency call',hours:4});
 function vacation(i,offset,length,status,type='vacation',extra={}){
 const n=db.vacation_requests.length;db.vacation_requests.push({id:'demo-vac-'+n,user_id:'demo-worker-'+i,start_date:date(plus(today,offset)),end_date:date(plus(today,offset+length-1)),request_type:type,notes:['Family trip to the land of unplugged phones','Camping: trading circuits for campfires','Visiting the grandkids','A very important beach inspection'][n%4],status,manager_note:status==='rejected'?'Crew coverage is needed that week. Please choose another date.':status==='approved'?'Approved — enjoy your time off.':null,created_at:stamp(-14+n%5),updated_at:stamp(-3),decided_at:status==='pending'?null:stamp(-3),decided_by:status==='pending'?null:'demo-manager',cancellation_status:null,...extra});
 }
 vacation(0,0,2,'approved');vacation(1,7,5,'approved');vacation(2,7,5,'approved');vacation(3,9,4,'pending');vacation(4,8,5,'pending');vacation(5,14,5,'rejected');vacation(6,21,3,'approved');
 vacation(7,28,5,'approved','vacation',{cancellation_status:'pending',cancellation_reason:'Family trip moved to next month.',cancellation_requested_at:stamp(-1)});
 vacation(8,12,2,'approved','vacation',{cancellation_status:'denied',cancellation_reason:'Plans changed.',cancellation_requested_at:stamp(-4),cancellation_manager_note:'Please discuss the revised schedule with the office.',cancellation_decided_at:stamp(-2)});
 vacation(9,17,3,'cancelled','vacation',{cancellation_status:'approved',cancellation_reason:'Trip cancelled.',cancellation_requested_at:stamp(-5),cancellation_decided_at:stamp(-2)});
 vacation(10,4,1,'approved','sick');vacation(11,6,2,'pending','unpaid');vacation(12,35,2,'pending','pto');vacation(13,40,5,'pending');vacation(1,-30,5,'approved');vacation(2,-15,3,'approved');
 db.audit_log=[{id:'demo-audit-1',actor_name:'Connie Circuit',action:'timesheet_returned',target_name:'Phil A. Panel',details:{reason:'Check Monday job code'},created_at:stamp(-1)},{id:'demo-audit-2',actor_name:'Connie Circuit',action:'vacation_approved',target_name:'Anita Breaker',details:{note:'Demo vacation approved'},created_at:stamp(-2)}];
 return db;
 }
 let db;try{const saved=JSON.parse(localStorage.getItem(STORE)||'null');db=saved?.seedDate===date(today)?saved.db:null}catch(e){}if(!db)db=seed();
 let activeId='demo-manager';
 const save=()=>{try{localStorage.setItem(STORE,JSON.stringify({seedDate:date(today),db}))}catch(e){}};
 const copy=v=>JSON.parse(JSON.stringify(v));const uid=()=> 'demo-'+crypto.randomUUID();
 const listeners=[];const profile=()=>db.profiles.find(p=>p.id===activeId);
 const user=()=>activeId?{id:activeId,email:profile().email,user_metadata:copy(profile())}:null;
 const session=()=>activeId?{user:user()}:null;
 class Query{
 constructor(table){this.table=table;this.filters=[];this.operation='select';this.columns='*';this.one=false;this.sorts=[];this.max=Infinity;}
 select(columns='*'){this.columns=columns;return this}insert(values){this.operation='insert';this.values=values;return this}update(values){this.operation='update';this.values=values;return this}delete(){this.operation='delete';return this}
 eq(k,v){this.filters.push(r=>r[k]===v);return this}neq(k,v){this.filters.push(r=>r[k]!==v);return this}in(k,values){this.filters.push(r=>values.includes(r[k]));return this}gte(k,v){this.filters.push(r=>r[k]>=v);return this}lte(k,v){this.filters.push(r=>r[k]<=v);return this}
 or(expression){const rules=expression.split(',').map(x=>x.split('.'));this.filters.push(r=>rules.some(([key,op,value])=>op==='eq'&&String(r[key])===value));return this}
 order(k,opt={}){this.sorts.push([k,opt.ascending!==false]);return this}limit(n){this.max=n;return this}single(){this.one=true;return this}maybeSingle(){this.one=true;this.optional=true;return this}
 then(resolve,reject){return Promise.resolve().then(()=>this.run()).then(resolve,reject)}
 run(){try{
 let rows=db[this.table];if(!rows)throw Error('Unknown demo table');let selected=rows.filter(r=>this.filters.every(f=>f(r)));
 if(this.operation==='insert'){selected=(Array.isArray(this.values)?this.values:[this.values]).map(v=>({id:uid(),created_at:new Date().toISOString(),updated_at:new Date().toISOString(),...copy(v)}));rows.push(...selected);save();}
 if(this.operation==='update'){selected.forEach(r=>Object.assign(r,copy(this.values),{updated_at:new Date().toISOString()}));save();}
 if(this.operation==='delete'){db[this.table]=rows.filter(r=>!selected.includes(r));save();}
 for(const [key,asc] of this.sorts.reverse())selected.sort((a,b)=>String(a[key]??'').localeCompare(String(b[key]??''))*(asc?1:-1));
 selected=selected.slice(0,this.max);let result=selected.map(r=>{const out=copy(r);if(this.columns.includes('profiles('))out.profiles=copy(db.profiles.find(p=>p.id===r.user_id)||{});if(this.columns.includes('worker:profiles'))out.worker=copy(db.profiles.find(p=>p.id===r.user_id)||{});if(this.columns.includes('timesheet_entries('))out.timesheet_entries=copy(db.timesheet_entries.filter(e=>e.timesheet_id===r.id));return out});
 if(this.one){if(!result.length&&!this.optional)return {data:null,error:{message:'Demo record changed or not found. Refresh and retry.'}};result=result[0]||null}
 return {data:result,error:null};
 }catch(e){return {data:null,error:{message:e.message}}}}
 }
 const client={from:table=>new Query(table),auth:{
 getSession:async()=>({data:{session:session()},error:null}),onAuthStateChange:fn=>{listeners.push(fn);return {data:{subscription:{unsubscribe(){}}}}},
 signInWithPassword:async({email})=>{const p=db.profiles.find(p=>p.email===email);if(!p)return {error:{message:'Use the demo person selector at the top.'}};activeId=p.id;listeners.forEach(fn=>fn('SIGNED_IN',session()));return {data:{session:session()},error:null}},
 signOut:async()=>{activeId=null;listeners.forEach(fn=>fn('SIGNED_OUT',null));return {error:null}},
 updateUser:async updates=>{Object.assign(profile(),updates.data||{});save();return {data:{user:user()},error:null}},
 signUp:async()=>({error:{message:'This is a fictional demo. Switch people using the selector above.'}}),resetPasswordForEmail:async()=>({error:{message:'Demo mode does not send emails. No password is needed: use the demo person selector.'}})
 },rpc:async(name,p)=>{
 if(name==='teammate_quick_fill'){
 if(!p.p_user)return {data:copy(db.profiles.filter(w=>w.status==='active'&&w.id!==activeId&&db.timesheets.some(t=>t.user_id===w.id&&t.week_start===p.p_week))),error:null};
 const ts=db.timesheets.find(t=>t.user_id===p.p_user&&t.week_start===p.p_week);return {data:copy(db.timesheet_entries.filter(e=>e.timesheet_id===ts?.id&&e.day_index===p.p_day)),error:null};
 }
 if(name==='request_vacation_cancellation'){const r=db.vacation_requests.find(r=>r.id===p.p_id&&r.user_id===activeId&&r.status==='approved');if(!r)return {error:{message:'Select your own approved vacation.'}};Object.assign(r,{cancellation_status:'pending',cancellation_reason:p.p_reason,cancellation_requested_at:new Date().toISOString(),updated_at:new Date().toISOString()});save();return {data:null,error:null}}
 return {error:{message:'Unsupported demo action'}};
 }};
 window.WarrenDemo={client,profiles:()=>copy(db.profiles),switchPerson:id=>{activeId=id;return user()},reset:()=>{db=seed();save()},inspect:()=>copy(db),seedDate:date(today)};
})();

