"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[7],{92285:(e,a,t)=>{t.d(a,{Z:()=>c});var s=t(85893),l=t(25675),n=t.n(l);function c(e){let{src:a,alt:t,width:l=800,height:c=600,className:i="",priority:r=!0}=e;return(0,s.jsx)("div",{className:"image-wrapper text-center mb-4 ".concat(i),children:(0,s.jsx)(n(),{src:a,alt:t,className:"img-fluid rounded",width:l,height:c,style:{width:"100%",height:"auto"},priority:r})})}},83007:(e,a,t)=>{t.d(a,{Z:()=>A});var s=t(85893),l=t(67294),n=t(97375),c=t(70525),i=t(19101),r=t(68070),o=t(23933);let d=e=>{let{currentPage:a,totalPages:t,maxPagesToShow:l=5,onPageChange:n,className:c=""}=e,i=[],r=Math.max(1,Math.min(a-Math.floor(l/2),t-l+1)),d=Math.min(t,r+l-1);i.push((0,s.jsx)(o.Z.First,{disabled:1===a,onClick:()=>n(1)},"first"),(0,s.jsx)(o.Z.Prev,{disabled:1===a,onClick:()=>n(a-1)},"prev")),r>1&&(i.push((0,s.jsx)(o.Z.Item,{onClick:()=>n(1),children:"1"},1)),r>2&&i.push((0,s.jsx)(o.Z.Ellipsis,{disabled:!0},"start-ellipsis")));for(let e=r;e<=d;e++)i.push((0,s.jsx)(o.Z.Item,{active:e===a,onClick:()=>n(e),children:e},e));return d<t&&(d<t-1&&i.push((0,s.jsx)(o.Z.Ellipsis,{disabled:!0},"end-ellipsis")),i.push((0,s.jsx)(o.Z.Item,{onClick:()=>n(t),children:t},t))),i.push((0,s.jsx)(o.Z.Next,{disabled:a===t,onClick:()=>n(a+1)},"next"),(0,s.jsx)(o.Z.Last,{disabled:a===t,onClick:()=>n(t)},"last")),(0,s.jsx)(o.Z,{className:c,children:i})};var m=t(21351);let x=e=>{let{size:a=5,pageSizeOptions:t=[5,10,20],onSizeChange:l,className:n=""}=e;return(0,s.jsxs)("fieldset",{className:"d-flex align-items-center ".concat(n),children:[(0,s.jsx)("legend",{className:"visually-hidden",children:"Page size selector"}),(0,s.jsx)(m.Z.Label,{htmlFor:"postsPerPageSelect",className:"me-2 mb-0",children:"Page size:"}),(0,s.jsx)(m.Z.Select,{id:"postsPerPageSelect",className:"mb-0",value:a,onChange:e=>l(Number(e.target.value)),style:{width:"100px"},children:t.map(e=>(0,s.jsx)("option",{value:e,children:e},e))})]})};var h=t(48352);function u(e){let{currentPage:a,totalPages:t,totalResults:l,size:c,pageSizeOptions:o=[5,10,20],maxPagesToShow:m=5,onPageChange:u,onSizeChange:g}=e,{t:j}=(0,h.$G)("common"),p=Math.min(a*c,l);return(0,s.jsx)(n.Z,{className:"pagination-bar",children:(0,s.jsxs)(i.Z,{className:"align-items-center justify-content-between flex-wrap gy-3",children:[(0,s.jsx)(r.Z,{xs:12,md:"auto",className:"d-flex justify-content-center flex-wrap",children:(0,s.jsx)(d,{className:"pagination mb-0",currentPage:a,totalPages:t,onPageChange:u,maxPagesToShow:m})}),(0,s.jsx)(r.Z,{xs:12,md:!0,className:"d-flex align-items-center justify-content-center justify-content-md-start",children:(0,s.jsx)("p",{className:"text-muted mb-0 text-nowrap",children:j("common.pagination.showingResults",{start:(a-1)*c+1,end:p,total:l})})}),(0,s.jsx)(r.Z,{xs:12,md:"auto",className:"d-flex align-items-center justify-content-center justify-content-md-end",children:(0,s.jsx)(x,{size:c,pageSizeOptions:o,onSizeChange:g})})]})})}var g=t(27749),j=t(53280),p=t(76720),D=t(97143),f=t(70270),N=t(92285),v=t(67814);function b(e){let{post:a}=e,{id:t,title:l,date:n,summary:c,thumbnail:i,topics:r,readingTime:o}=a,{t:d}=(0,h.$G)("post");return(0,s.jsx)("div",{className:"post-card d-flex align-items-center mb-4",children:(0,s.jsxs)("div",{className:"post-card-content flex-grow-1",children:[(0,s.jsx)("h2",{className:"fw-bold mb-4",children:(0,s.jsx)(g.Z,{href:"/posts/".concat(t),className:"link",children:l})}),(0,s.jsxs)("p",{className:"d-flex align-items-center",children:[(0,s.jsxs)(g.Z,{href:"/posts/".concat(t),className:"link-muted d-flex align-items-center me-3",children:[(0,s.jsx)(v.G,{icon:"calendar-alt",className:"me-2"}),(0,s.jsx)(D.Z,{date:n})]}),(0,s.jsxs)("span",{className:"text-muted d-flex align-items-center",children:[(0,s.jsx)(v.G,{icon:"clock",className:"me-2"}),o]})]}),r&&r.length>0&&(0,s.jsx)("div",{className:"mb-4",children:r.map(e=>(0,s.jsx)(g.Z,{href:"/topics/".concat(e.id),children:(0,s.jsx)(j.Z,{bg:e.color,className:"me-2 badge-".concat(e.color),children:e.name})},e.id))}),i&&(0,s.jsx)(g.Z,{href:"/posts/".concat(t),children:(0,s.jsx)(N.Z,{className:"thumbnail-wrapper",src:"".concat(f.Vc).concat(i),alt:l,width:800,height:600})}),(0,s.jsx)("p",{className:"mb-4",children:c}),(0,s.jsx)("div",{className:"mb-4",children:(0,s.jsx)(g.Z,{href:"/posts/".concat(t),children:(0,s.jsx)(p.Z,{className:"primary",children:d("post.readMore")})})})]})})}let k=(e,a)=>e.title.toLowerCase().includes(a.toLowerCase())||e.summary.toLowerCase().includes(a.toLowerCase()),y=(e,a)=>{var t;return 0===a.length||(null===(t=e.topics)||void 0===t?void 0:t.some(e=>a.includes(e.id)))},w=(e,a)=>{let t=new Date(e.date).getTime(),s=a.startDate?new Date(a.startDate).setHours(0,0,0,0):void 0,l=a.endDate?new Date(a.endDate).setHours(23,59,59,999):void 0;return(!s||t>=s)&&(!l||t<=l)};var Z=t(85742),C=t(41874);function S(e){let{sortOrder:a,onChange:t}=e,{t:l}=(0,h.$G)("common");return(0,s.jsxs)(Z.Z,{id:"sort-dropdown",variant:"green",className:"mb-2",align:"start",flip:!1,title:(0,s.jsxs)("span",{children:[(0,s.jsx)(v.G,{icon:"sort",className:"me-2"}),l("asc"===a?"common.sort.oldest":"common.sort.newest")]}),onSelect:e=>e&&t(e),children:[(0,s.jsxs)(C.Z.Item,{eventKey:"desc",children:[l("common.sort.newest"),"desc"===a&&(0,s.jsx)(v.G,{icon:"circle-check",className:"ms-2 circle-check"})]}),(0,s.jsxs)(C.Z.Item,{eventKey:"asc",children:[l("common.sort.oldest"),"asc"===a&&(0,s.jsx)(v.G,{icon:"circle-check",className:"ms-2 circle-check"})]})]})}var P=t(98794);function L(e){let{topics:a,selectedTopics:t,onTopicsChange:n}=e,{t:i}=(0,h.$G)(["common","topic"]),[r,o]=(0,l.useState)(""),[m,x]=(0,l.useState)(1),[u,g]=(0,l.useState)(!1),[D,f]=(0,l.useState)(t),N=(0,l.useMemo)(()=>a.filter(e=>e.name.toLowerCase().includes(r.toLowerCase().trim())),[a,r]),b=(0,l.useMemo)(()=>N.slice((m-1)*5,5*m),[N,m,5]),k=(0,l.useMemo)(()=>{if(0===t.length)return i("topic:topic.allTopics");if(t.length>3){let e=t.slice(0,3).map(e=>{var t;return null===(t=a.find(a=>a.id===e))||void 0===t?void 0:t.name}).filter(Boolean).join(", ");return"".concat(e," ").concat(i("common.andMore",{count:t.length-3}))}return t.map(e=>{var t;return null===(t=a.find(a=>a.id===e))||void 0===t?void 0:t.name}).filter(Boolean).join(", ")},[t,a,i]),y=(0,l.useCallback)(e=>{o(e),x(1)},[]),w=(0,l.useCallback)(e=>{x(e)},[]),S=(0,l.useCallback)(e=>{D.includes(e)||f([...D,e])},[D]),L=(0,l.useCallback)(()=>{f([]),g(!1),n([])},[f,g,n]),G=(0,l.useCallback)(e=>{f(D.filter(a=>a!==e))},[D]),T=(0,l.useCallback)(()=>{n(D),g(!1)},[D,n]);return(0,s.jsxs)(Z.Z,{id:"topics-dropdown",variant:"gray",className:"mb-2 topics-dropdown",flip:!1,align:"start",title:(0,s.jsxs)("span",{children:[(0,s.jsx)(v.G,{icon:"tags",className:"me-2"}),k]}),show:u,onToggle:e=>{g(e),e||f(t)},autoClose:"outside",children:[(0,s.jsx)("div",{className:"p-2",children:(0,s.jsx)(P.Z,{query:r,onChange:y,className:"w-100"})}),(0,s.jsx)(C.Z.Divider,{}),D.length>0&&(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(C.Z.Header,{children:(0,s.jsxs)("div",{className:"d-flex justify-content-between align-items-center",children:[(0,s.jsx)("span",{children:i("topic:topic.selectedTopics")}),(0,s.jsxs)(p.Z,{variant:"danger",onClick:L,className:"btn-badge",children:[(0,s.jsx)(v.G,{icon:"trash",className:"me-2"}),i("common.clearAll")]})]})}),(0,s.jsx)("div",{className:"p-2 ms-2",children:D.map(e=>{let t=a.find(a=>a.id===e);return t?(0,s.jsxs)(j.Z,{bg:t.color,className:"badge-".concat(t.color," me-2 mb-2"),children:[t.name," ",(0,s.jsx)(v.G,{icon:"times",className:"ms-1 cursor-pointer",onClick:()=>G(e)})]},e):null})}),(0,s.jsx)(C.Z.Divider,{})]}),(0,s.jsxs)(C.Z.Item,{className:"d-flex align-items-center",onClick:L,children:[(0,s.jsx)(j.Z,{bg:"gray",className:"badge-gray me-2",children:i("topic:topic.allTopics")}),0===D.length&&(0,s.jsx)(v.G,{icon:"circle-check",className:"ms-auto"})]}),b.length>0?b.map(e=>(0,s.jsxs)(C.Z.Item,{onClick:()=>S(e.id),className:"d-flex align-items-center",children:[(0,s.jsx)(j.Z,{bg:e.color,className:"badge-".concat(e.color," me-2"),children:e.name}),D.includes(e.id)&&(0,s.jsx)(v.G,{icon:"circle-check",className:"ms-auto"})]},e.id)):(0,s.jsx)(C.Z.Item,{className:"text-center py-3",children:(0,s.jsxs)(c.Z,{variant:"warning",className:"mb-0 d-flex align-items-center",children:[(0,s.jsx)(v.G,{icon:"exclamation-circle",className:"me-2",size:"lg"}),i("topic:topic.noTopicFound")]})}),N.length>0&&(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(C.Z.Divider,{}),(0,s.jsx)("div",{className:"d-flex justify-content-center p-2",children:(0,s.jsx)(d,{currentPage:m,totalPages:Math.ceil(N.length/5),maxPagesToShow:5,onPageChange:w})})]}),(0,s.jsx)(C.Z.Divider,{}),(0,s.jsx)("div",{className:"d-flex justify-content-center p-2",children:(0,s.jsxs)(p.Z,{className:"apply-button",variant:"success",disabled:0===t.length&&0===D.length,onClick:T,children:[(0,s.jsx)(v.G,{icon:"check",className:"me-2"}),i("common.datePicker.applySelection")]})})]})}var G=t(34421),T=t.n(G),M=t(11163),z=t(9198),I=t.n(z),F=t(18647),_=t(75104);t(58837);var E=t(87536),q=t(47533),R=t(16310);let $=e=>R.Ry().shape({startDate:R.hT().required(e("common.validation.required")).typeError(e("common.validation.datetimelocal")).test("startDateBeforeEndDate",e("common.validation.startDateAfterEndDate"),function(e){let{endDate:a}=this.parent;return!(e&&a&&e>a)}),endDate:R.hT().required(e("common.validation.required")).typeError(e("common.validation.datetimelocal")).test("endDateAfterStartDate",e("common.validation.endDateBeforeStartDate"),function(e){let{startDate:a}=this.parent;return!(e&&a&&e<a)})});function H(e){var a;let{onRangeChange:t,minDate:n=new Date("2024-01-01"),maxDate:c=new Date}=e,{t:i}=(0,h.$G)("common"),r=null!==(a=(0,M.useRouter)().query.locale)&&void 0!==a?a:T().i18n.defaultLocale,o={en:F._,tr:_.tr}[r]||F._;(0,l.useMemo)(()=>{(0,z.registerLocale)("en",F._),(0,z.registerLocale)("tr",_.tr)},[]);let d=$(i),{handleSubmit:x,control:u,reset:g,getValues:j,clearErrors:D,formState:{errors:f}}=(0,E.cI)({resolver:(0,q.X)(d),defaultValues:{startDate:void 0,endDate:void 0}}),N=(0,l.useCallback)(e=>i("common.datePicker.".concat(e)),[i]),[b,k]=(0,l.useState)(null),[y,w]=(0,l.useState)(!1),[S,P]=(0,l.useState)(!1),L=(0,l.useMemo)(()=>{if("customDate"===b){if(S){let{startDate:e,endDate:a}=j(),t=e?e.toLocaleDateString():"",s=a?a.toLocaleDateString():"";return t&&s?"".concat(t," - ").concat(s):N("customDate")}return N("customDate")}return b?N(b):N("selectDate")},[b,S,j,N]),G=(e,a)=>{let s,l;if(a&&"customDate"===e&&(a.preventDefault(),a.stopPropagation()),"customDate"===e&&!S){k(e);return}"customDate"!==e&&w(!1),k(e);let n=new Date;switch(e){case"today":s=n.toLocaleDateString(),l=n.toLocaleDateString();break;case"yesterday":let c=new Date(n);c.setDate(n.getDate()-1),s=c.toLocaleDateString(),l=c.toLocaleDateString();break;case"last7Days":let i=new Date(n);i.setDate(n.getDate()-7),s=i.toLocaleDateString(),l=n.toLocaleDateString();break;case"last30Days":let r=new Date(n);r.setDate(n.getDate()-30),s=r.toLocaleDateString(),l=n.toLocaleDateString();break;case"customDate":let{startDate:o,endDate:d}=j();s=o?o.toLocaleDateString():void 0,l=d?d.toLocaleDateString():void 0}t({startDate:s,endDate:l})},R=!!b,H=new Date(n).setHours(0,0,0,0),B=new Date(c).setHours(23,59,59,999),A=e=>e.getTime()<H||e.getTime()>B?"react-datepicker__day--muted":"",O=[{key:"today",label:N("today")},{key:"yesterday",label:N("yesterday")},{key:"last7Days",label:N("last7Days")},{key:"last30Days",label:N("last30Days")},{key:"customDate",label:N("customDate")}];return(0,s.jsx)(m.Z,{onSubmit:x(e=>{if("customDate"===b){var a,s;t({startDate:null===(a=e.startDate)||void 0===a?void 0:a.toLocaleDateString(),endDate:null===(s=e.endDate)||void 0===s?void 0:s.toLocaleDateString()})}P(!0),w(!1)}),children:(0,s.jsxs)(Z.Z,{id:"date-range-dropdown",variant:"orange",className:"date-picker-dropdown mb-2",align:"start",flip:!1,title:(0,s.jsxs)("span",{children:[(0,s.jsx)(v.G,{icon:"calendar-alt",className:"me-2"}),L]}),show:y,onToggle:e=>{w(e),e||P(!1)},autoClose:"outside",children:[O.map(e=>(0,s.jsxs)(C.Z.Item,{onClick:a=>G(e.key,a),className:"d-flex justify-content-between align-items-center",children:[e.label,b===e.key&&(0,s.jsx)(v.G,{icon:"circle-check",className:"circle-check ms-2"})]},e.key)),"customDate"===b&&(0,s.jsxs)("div",{className:"p-3",children:[(0,s.jsxs)("div",{className:"d-flex flex-column mb-4",children:[(0,s.jsx)(m.Z.Label,{className:"mb-2",children:i("common.datePicker.startDateLabel")}),(0,s.jsxs)("div",{className:"d-flex align-items-center",children:[(0,s.jsx)(v.G,{icon:"calendar-alt",className:"me-2"}),(0,s.jsx)(E.Qr,{name:"startDate",control:u,render:e=>{let{field:{onChange:a,value:t}}=e;return(0,s.jsx)(I(),{selected:t,onChange:e=>{a(e),D()},locale:o,dateFormat:"P",isClearable:!0,className:"form-control",placeholderText:i("common.datePicker.startDatePlaceholder"),minDate:n,maxDate:c,dayClassName:A})}})]}),f.startDate&&(0,s.jsx)(m.Z.Text,{className:"text-danger mt-2",children:f.startDate.message})]}),(0,s.jsxs)("div",{className:"d-flex flex-column mb-4",children:[(0,s.jsx)(m.Z.Label,{className:"mb-2",children:i("common.datePicker.endDateLabel")}),(0,s.jsxs)("div",{className:"d-flex align-items-center",children:[(0,s.jsx)(v.G,{icon:"calendar-alt",className:"me-2"}),(0,s.jsx)(E.Qr,{name:"endDate",control:u,render:e=>{let{field:{onChange:a,value:t}}=e;return(0,s.jsx)(I(),{selected:t,onChange:e=>{a(e),D()},locale:o,dateFormat:"P",isClearable:!0,className:"form-control",placeholderText:i("common.datePicker.endDatePlaceholder"),minDate:n,maxDate:c,dayClassName:A})}})]}),f.endDate&&(0,s.jsx)(m.Z.Text,{className:"text-danger mt-2",children:f.endDate.message})]}),(0,s.jsx)("div",{className:"d-flex align-items-center",children:(0,s.jsxs)(p.Z,{variant:"success",type:"submit",size:"sm",className:"date-picker-button",children:[(0,s.jsx)(v.G,{icon:"check",className:"me-2"}),i("common.datePicker.applySelection")]})})]}),R&&(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(C.Z.Divider,{}),(0,s.jsx)("div",{className:"date-picker-clear-button-container",children:(0,s.jsxs)(p.Z,{variant:"danger",onClick:()=>{g(),k(null),t({startDate:void 0,endDate:void 0}),w(!1)},size:"sm",className:"date-picker-button",children:[(0,s.jsx)(v.G,{icon:"times",className:"me-2"}),i("common.datePicker.clearSelection")]})})]})]})})}function B(e){let{searchQuery:a,onSearchChange:t,sortOrder:l,onSortChange:n,selectedTopics:c,onTopicsChange:i,onDateRangeChange:r,topics:o=[]}=e;return(0,s.jsxs)("div",{className:"d-flex flex-wrap align-items-center mb-3",children:[(0,s.jsx)("div",{className:"flex-grow-1 mb-4",children:(0,s.jsx)(P.Z,{query:a,onChange:t})}),(0,s.jsxs)("div",{className:"d-flex flex-column flex-md-row align-items-stretch w-100 w-md-auto",style:{gap:"10px"},children:[o.length>0&&(0,s.jsx)(L,{topics:o,selectedTopics:c,onTopicsChange:i}),(0,s.jsx)(H,{onRangeChange:r,minDate:new Date("2024-01-01"),maxDate:new Date}),(0,s.jsx)(S,{sortOrder:l,onChange:n})]})]})}function A(e){let{posts:a,topics:t=[],noPostsFoundMessage:i}=e,{t:r}=(0,h.$G)(["post","common"]),[o,d]=(0,l.useState)(5),[m,x]=(0,l.useState)(1),[g,j]=(0,l.useState)(""),[p,D]=(0,l.useState)("desc"),[f,N]=(0,l.useState)([]),[Z,C]=(0,l.useState)({}),S=(0,l.useMemo)(()=>a.filter(e=>k(e,g)&&y(e,f)&&w(e,Z)),[a,g,f,Z]),P=(0,l.useMemo)(()=>[...S].sort((e,a)=>"asc"===p?new Date(e.date).getTime()-new Date(a.date).getTime():new Date(a.date).getTime()-new Date(e.date).getTime()),[S,p]),L=(0,l.useMemo)(()=>P.slice((m-1)*o,m*o),[P,m,o]),G=(0,l.useCallback)(e=>{D(e),x(1)},[]),T=(0,l.useCallback)(e=>{N(e),x(1)},[]),M=(0,l.useCallback)(e=>{d(e),x(1)},[]),z=(0,l.useCallback)(e=>{C(e),x(1)},[]);return(0,s.jsxs)(n.Z,{className:"mt-5",style:{maxWidth:"800px"},children:[(0,s.jsx)(B,{searchQuery:g,onSearchChange:j,sortOrder:p,onSortChange:G,selectedTopics:f,onTopicsChange:T,onDateRangeChange:z,topics:t}),L.length>0?L.map(e=>(0,s.jsx)(b,{post:e},e.id)):(0,s.jsxs)(c.Z,{variant:"warning",className:"mb-0 d-flex align-items-center justify-content-center py-3",children:[(0,s.jsx)(v.G,{icon:"exclamation-circle",className:"me-2",size:"lg"}),null!=i?i:r("post.noPostsFound")]}),P.length>0&&(0,s.jsx)(u,{currentPage:m,totalPages:Math.ceil(P.length/o),size:o,onPageChange:x,onSizeChange:M,totalResults:P.length})]})}}}]);