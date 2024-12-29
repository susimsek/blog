"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[316],{92285:(e,a,t)=>{t.d(a,{Z:()=>l});var s=t(85893),n=t(25675),c=t.n(n);function l(e){let{src:a,alt:t,width:n=800,height:l=600,className:i="",priority:r=!0}=e;return(0,s.jsx)("div",{className:"image-wrapper text-center mb-4 ".concat(i),children:(0,s.jsx)(c(),{src:a,alt:t,className:"img-fluid rounded",width:n,height:l,style:{width:"100%",height:"auto"},priority:r})})}},33316:(e,a,t)=>{t.d(a,{Z:()=>$});var s=t(85893),n=t(67294),c=t(97375),l=t(70525),i=t(19101),r=t(68070),o=t(81954),m=t(21351);let d=e=>{let{size:a=5,pageSizeOptions:t=[5,10,20],onSizeChange:n,className:c=""}=e;return(0,s.jsxs)("fieldset",{className:"d-flex align-items-center ".concat(c),children:[(0,s.jsx)("legend",{className:"visually-hidden",children:"Page size selector"}),(0,s.jsx)(m.Z.Label,{htmlFor:"postsPerPageSelect",className:"me-2 mb-0",children:"Page size:"}),(0,s.jsx)(m.Z.Select,{id:"postsPerPageSelect",className:"mb-0",value:a,onChange:e=>n(Number(e.target.value)),style:{width:"100px"},children:t.map(e=>(0,s.jsx)("option",{value:e,children:e},e))})]})};var x=t(48352);function h(e){let{currentPage:a,totalPages:t,totalResults:n,size:l,pageSizeOptions:m=[5,10,20],maxPagesToShow:h=5,onPageChange:u,onSizeChange:g}=e,{t:j}=(0,x.$G)("common"),p=Math.min(a*l,n);return(0,s.jsx)(c.Z,{className:"pagination-bar",children:(0,s.jsxs)(i.Z,{className:"align-items-center justify-content-between flex-wrap gy-3",children:[(0,s.jsx)(r.Z,{xs:12,md:"auto",className:"d-flex justify-content-center flex-wrap",children:(0,s.jsx)(o.Z,{className:"pagination mb-0",currentPage:a,totalPages:t,onPageChange:u,maxPagesToShow:h})}),(0,s.jsx)(r.Z,{xs:12,md:!0,className:"d-flex align-items-center justify-content-center justify-content-md-start",children:(0,s.jsx)("p",{className:"text-muted mb-0 text-nowrap",children:j("common.pagination.showingResults",{start:(a-1)*l+1,end:p,total:n})})}),(0,s.jsx)(r.Z,{xs:12,md:"auto",className:"d-flex align-items-center justify-content-center justify-content-md-end",children:(0,s.jsx)(d,{size:l,pageSizeOptions:m,onSizeChange:g})})]})})}var u=t(27749),g=t(53280),j=t(76720),p=t(97143),D=t(70270),f=t(92285),N=t(67814);function b(e){let{post:a}=e,{id:t,title:n,date:c,summary:l,thumbnail:i,topics:r,readingTime:o}=a,{t:m}=(0,x.$G)("post");return(0,s.jsx)("div",{className:"post-card d-flex align-items-center mb-4",children:(0,s.jsxs)("div",{className:"post-card-content flex-grow-1",children:[(0,s.jsx)("h2",{className:"fw-bold mb-4",children:(0,s.jsx)(u.Z,{href:"/posts/".concat(t),className:"link",children:n})}),(0,s.jsxs)("p",{className:"d-flex align-items-center",children:[(0,s.jsxs)(u.Z,{href:"/posts/".concat(t),className:"link-muted d-flex align-items-center me-3",children:[(0,s.jsx)(N.G,{icon:"calendar-alt",className:"me-2"}),(0,s.jsx)(p.Z,{date:c})]}),(0,s.jsxs)("span",{className:"text-muted d-flex align-items-center",children:[(0,s.jsx)(N.G,{icon:"clock",className:"me-2"}),o]})]}),r&&r.length>0&&(0,s.jsx)("div",{className:"mb-4",children:r.map(e=>(0,s.jsx)(u.Z,{href:"/topics/".concat(e.id),children:(0,s.jsx)(g.Z,{bg:e.color,className:"me-2 badge-".concat(e.color),children:e.name})},e.id))}),i&&(0,s.jsx)(u.Z,{href:"/posts/".concat(t),children:(0,s.jsx)(f.Z,{className:"thumbnail-wrapper",src:"".concat(D.Vc).concat(i),alt:n,width:800,height:600})}),(0,s.jsx)("p",{className:"mb-4",children:l}),(0,s.jsx)("div",{className:"mb-4",children:(0,s.jsx)(u.Z,{href:"/posts/".concat(t),children:(0,s.jsx)(j.Z,{className:"primary",children:m("post.readMore")})})})]})})}var v=t(47340),y=t(85742),k=t(41874);function w(e){let{sortOrder:a,onChange:t}=e,{t:n}=(0,x.$G)("common");return(0,s.jsxs)(y.Z,{id:"sort-dropdown",variant:"green",className:"mb-2",align:"start",flip:!1,title:(0,s.jsxs)("span",{children:[(0,s.jsx)(N.G,{icon:"sort",className:"me-2"}),n("asc"===a?"common.sort.oldest":"common.sort.newest")]}),onSelect:e=>e&&t(e),children:[(0,s.jsxs)(k.Z.Item,{eventKey:"desc",children:[n("common.sort.newest"),"desc"===a&&(0,s.jsx)(N.G,{icon:"circle-check",className:"ms-2 circle-check"})]}),(0,s.jsxs)(k.Z.Item,{eventKey:"asc",children:[n("common.sort.oldest"),"asc"===a&&(0,s.jsx)(N.G,{icon:"circle-check",className:"ms-2 circle-check"})]})]})}var Z=t(98794);function C(e){let{topics:a,selectedTopics:t,onTopicsChange:c}=e,{t:i}=(0,x.$G)(["common","topic"]),[r,m]=(0,n.useState)(""),[d,h]=(0,n.useState)(1),[u,p]=(0,n.useState)(!1),[D,f]=(0,n.useState)(t),b=(0,n.useMemo)(()=>a.filter(e=>e.name.toLowerCase().includes(r.toLowerCase().trim())),[a,r]),v=(0,n.useMemo)(()=>b.slice((d-1)*5,5*d),[b,d,5]),w=(0,n.useMemo)(()=>{if(0===t.length)return i("topic:topic.allTopics");if(t.length>3){let e=t.slice(0,3).map(e=>{var t;return null===(t=a.find(a=>a.id===e))||void 0===t?void 0:t.name}).filter(Boolean).join(", ");return"".concat(e," ").concat(i("common.andMore",{count:t.length-3}))}return t.map(e=>{var t;return null===(t=a.find(a=>a.id===e))||void 0===t?void 0:t.name}).filter(Boolean).join(", ")},[t,a,i]),C=(0,n.useCallback)(e=>{m(e),h(1)},[]),S=(0,n.useCallback)(e=>{h(e)},[]),P=(0,n.useCallback)(e=>{D.includes(e)||f([...D,e])},[D]),G=(0,n.useCallback)(()=>{f([]),p(!1),c([])},[f,p,c]),T=(0,n.useCallback)(e=>{f(D.filter(a=>a!==e))},[D]),L=(0,n.useCallback)(()=>{c(D),p(!1)},[D,c]);return(0,s.jsxs)(y.Z,{id:"topics-dropdown",variant:"gray",className:"mb-2 topics-dropdown",flip:!1,align:"start",title:(0,s.jsxs)("span",{children:[(0,s.jsx)(N.G,{icon:"tags",className:"me-2"}),w]}),show:u,onToggle:e=>{p(e),e||f(t)},autoClose:"outside",children:[(0,s.jsx)("div",{className:"p-2",children:(0,s.jsx)(Z.Z,{query:r,onChange:C,className:"w-100"})}),(0,s.jsx)(k.Z.Divider,{}),D.length>0&&(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(k.Z.Header,{children:(0,s.jsxs)("div",{className:"d-flex justify-content-between align-items-center",children:[(0,s.jsx)("span",{children:i("topic:topic.selectedTopics")}),(0,s.jsxs)(j.Z,{variant:"danger",onClick:G,className:"btn-badge",children:[(0,s.jsx)(N.G,{icon:"trash",className:"me-2"}),i("common.clearAll")]})]})}),(0,s.jsx)("div",{className:"p-2 ms-2",children:D.map(e=>{let t=a.find(a=>a.id===e);return t?(0,s.jsxs)(g.Z,{bg:t.color,className:"badge-".concat(t.color," me-2 mb-2"),children:[t.name," ",(0,s.jsx)(N.G,{icon:"times",className:"ms-1 cursor-pointer",onClick:()=>T(e)})]},e):null})}),(0,s.jsx)(k.Z.Divider,{})]}),(0,s.jsxs)(k.Z.Item,{className:"d-flex align-items-center",onClick:G,children:[(0,s.jsx)(g.Z,{bg:"gray",className:"badge-gray me-2",children:i("topic:topic.allTopics")}),0===D.length&&(0,s.jsx)(N.G,{icon:"circle-check",className:"ms-auto"})]}),v.length>0?v.map(e=>(0,s.jsxs)(k.Z.Item,{onClick:()=>P(e.id),className:"d-flex align-items-center",children:[(0,s.jsx)(g.Z,{bg:e.color,className:"badge-".concat(e.color," me-2"),children:e.name}),D.includes(e.id)&&(0,s.jsx)(N.G,{icon:"circle-check",className:"ms-auto"})]},e.id)):(0,s.jsx)(k.Z.Item,{className:"text-center py-3",children:(0,s.jsxs)(l.Z,{variant:"warning",className:"mb-0 d-flex align-items-center",children:[(0,s.jsx)(N.G,{icon:"exclamation-circle",className:"me-2",size:"lg"}),i("topic:topic.noTopicFound")]})}),b.length>0&&(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(k.Z.Divider,{}),(0,s.jsx)("div",{className:"d-flex justify-content-center p-2",children:(0,s.jsx)(o.Z,{currentPage:d,totalPages:Math.ceil(b.length/5),maxPagesToShow:5,onPageChange:S})})]}),(0,s.jsx)(k.Z.Divider,{}),(0,s.jsx)("div",{className:"d-flex justify-content-center p-2",children:(0,s.jsxs)(j.Z,{className:"apply-button",variant:"success",disabled:0===t.length&&0===D.length,onClick:L,children:[(0,s.jsx)(N.G,{icon:"check",className:"me-2"}),i("common.datePicker.applySelection")]})})]})}var S=t(34421),P=t.n(S),G=t(11163),T=t(9198),L=t.n(T),M=t(18647),z=t(75104);t(58837);var _=t(87536),F=t(47533),q=t(16310);let I=e=>q.Ry().shape({startDate:q.hT().required(e("common.validation.required")).typeError(e("common.validation.datetimelocal")).test("startDateBeforeEndDate",e("common.validation.startDateAfterEndDate"),function(e){let{endDate:a}=this.parent;return!(e&&a&&e>a)}),endDate:q.hT().required(e("common.validation.required")).typeError(e("common.validation.datetimelocal")).test("endDateAfterStartDate",e("common.validation.endDateBeforeStartDate"),function(e){let{startDate:a}=this.parent;return!(e&&a&&e<a)})});function E(e){var a;let{onRangeChange:t,minDate:c=new Date("2024-01-01"),maxDate:l=new Date}=e,{t:i}=(0,x.$G)("common"),r=null!==(a=(0,G.useRouter)().query.locale)&&void 0!==a?a:P().i18n.defaultLocale,o={en:M._,tr:z.tr}[r]||M._;(0,n.useMemo)(()=>{(0,T.registerLocale)("en",M._),(0,T.registerLocale)("tr",z.tr)},[]);let d=I(i),{handleSubmit:h,control:u,reset:g,getValues:p,clearErrors:D,formState:{errors:f}}=(0,_.cI)({resolver:(0,F.X)(d),defaultValues:{startDate:void 0,endDate:void 0}}),b=(0,n.useCallback)(e=>i("common.datePicker.".concat(e)),[i]),[v,w]=(0,n.useState)(null),[Z,C]=(0,n.useState)(!1),[S,q]=(0,n.useState)(!1),E=(0,n.useMemo)(()=>{if("customDate"===v){if(S){let{startDate:e,endDate:a}=p(),t=e?e.toLocaleDateString():"",s=a?a.toLocaleDateString():"";return t&&s?"".concat(t," - ").concat(s):b("customDate")}return b("customDate")}return v?b(v):b("selectDate")},[v,S,p,b]),R=(e,a)=>{let s,n;if(a&&"customDate"===e&&(a.preventDefault(),a.stopPropagation()),"customDate"===e&&!S){w(e);return}"customDate"!==e&&C(!1),w(e);let c=new Date;switch(e){case"today":{let e=c.toLocaleDateString();s=e,n=e;break}case"yesterday":{let e=new Date(c);e.setDate(c.getDate()-1),s=e.toLocaleDateString(),n=e.toLocaleDateString();break}case"last7Days":{let e=new Date(c);e.setDate(c.getDate()-7),s=e.toLocaleDateString(),n=c.toLocaleDateString();break}case"last30Days":{let e=new Date(c);e.setDate(c.getDate()-30),s=e.toLocaleDateString(),n=c.toLocaleDateString();break}case"customDate":{let{startDate:e,endDate:a}=p();s=e?e.toLocaleDateString():void 0,n=a?a.toLocaleDateString():void 0}}t({startDate:s,endDate:n})},$=!!v,B=new Date(c).setHours(0,0,0,0),A=new Date(l).setHours(23,59,59,999),H=e=>e.getTime()<B||e.getTime()>A?"react-datepicker__day--muted":"",O=[{key:"today",label:b("today")},{key:"yesterday",label:b("yesterday")},{key:"last7Days",label:b("last7Days")},{key:"last30Days",label:b("last30Days")},{key:"customDate",label:b("customDate")}];return(0,s.jsx)(m.Z,{onSubmit:h(e=>{if("customDate"===v){var a,s;t({startDate:null===(a=e.startDate)||void 0===a?void 0:a.toLocaleDateString(),endDate:null===(s=e.endDate)||void 0===s?void 0:s.toLocaleDateString()})}q(!0),C(!1)}),children:(0,s.jsxs)(y.Z,{id:"date-range-dropdown",variant:"orange",className:"date-picker-dropdown mb-2",align:"start",flip:!1,title:(0,s.jsxs)("span",{children:[(0,s.jsx)(N.G,{icon:"calendar-alt",className:"me-2"}),E]}),show:Z,onToggle:e=>{C(e),e||q(!1)},autoClose:"outside",children:[O.map(e=>(0,s.jsxs)(k.Z.Item,{onClick:a=>R(e.key,a),className:"d-flex justify-content-between align-items-center",children:[e.label,v===e.key&&(0,s.jsx)(N.G,{icon:"circle-check",className:"circle-check ms-2"})]},e.key)),"customDate"===v&&(0,s.jsxs)("div",{className:"p-3",children:[(0,s.jsxs)("div",{className:"d-flex flex-column mb-4",children:[(0,s.jsx)(m.Z.Label,{className:"mb-2",children:i("common.datePicker.startDateLabel")}),(0,s.jsxs)("div",{className:"d-flex align-items-center",children:[(0,s.jsx)(N.G,{icon:"calendar-alt",className:"me-2"}),(0,s.jsx)(_.Qr,{name:"startDate",control:u,render:e=>{let{field:{onChange:a,value:t}}=e;return(0,s.jsx)(L(),{selected:t,onChange:e=>{a(e),D()},locale:o,dateFormat:"P",isClearable:!0,className:"form-control",placeholderText:i("common.datePicker.startDatePlaceholder"),minDate:c,maxDate:l,dayClassName:H})}})]}),f.startDate&&(0,s.jsx)(m.Z.Text,{className:"text-danger mt-2",children:f.startDate.message})]}),(0,s.jsxs)("div",{className:"d-flex flex-column mb-4",children:[(0,s.jsx)(m.Z.Label,{className:"mb-2",children:i("common.datePicker.endDateLabel")}),(0,s.jsxs)("div",{className:"d-flex align-items-center",children:[(0,s.jsx)(N.G,{icon:"calendar-alt",className:"me-2"}),(0,s.jsx)(_.Qr,{name:"endDate",control:u,render:e=>{let{field:{onChange:a,value:t}}=e;return(0,s.jsx)(L(),{selected:t,onChange:e=>{a(e),D()},locale:o,dateFormat:"P",isClearable:!0,className:"form-control",placeholderText:i("common.datePicker.endDatePlaceholder"),minDate:c,maxDate:l,dayClassName:H})}})]}),f.endDate&&(0,s.jsx)(m.Z.Text,{className:"text-danger mt-2",children:f.endDate.message})]}),(0,s.jsx)("div",{className:"d-flex align-items-center",children:(0,s.jsxs)(j.Z,{variant:"success",type:"submit",size:"sm",className:"date-picker-button",children:[(0,s.jsx)(N.G,{icon:"check",className:"me-2"}),i("common.datePicker.applySelection")]})})]}),$&&(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(k.Z.Divider,{}),(0,s.jsx)("div",{className:"date-picker-clear-button-container",children:(0,s.jsxs)(j.Z,{variant:"danger",onClick:()=>{g(),w(null),t({startDate:void 0,endDate:void 0}),C(!1)},size:"sm",className:"date-picker-button",children:[(0,s.jsx)(N.G,{icon:"times",className:"me-2"}),i("common.datePicker.clearSelection")]})})]})]})})}function R(e){let{searchQuery:a,onSearchChange:t,sortOrder:n,onSortChange:c,selectedTopics:l,onTopicsChange:i,onDateRangeChange:r,topics:o=[]}=e;return(0,s.jsxs)("div",{className:"d-flex flex-wrap align-items-center mb-3",children:[(0,s.jsx)("div",{className:"flex-grow-1 mb-4",children:(0,s.jsx)(Z.Z,{query:a,onChange:t})}),(0,s.jsxs)("div",{className:"d-flex flex-column flex-md-row align-items-stretch w-100 w-md-auto",style:{gap:"10px"},children:[o.length>0&&(0,s.jsx)(C,{topics:o,selectedTopics:l,onTopicsChange:i}),(0,s.jsx)(E,{onRangeChange:r,minDate:new Date("2024-01-01"),maxDate:new Date}),(0,s.jsx)(w,{sortOrder:n,onChange:c})]})]})}function $(e){let{posts:a,topics:t=[],noPostsFoundMessage:i}=e,{t:r}=(0,x.$G)(["post","common"]),[o,m]=(0,n.useState)(5),[d,u]=(0,n.useState)(1),[g,j]=(0,n.useState)(""),[p,D]=(0,n.useState)("desc"),[f,y]=(0,n.useState)([]),[k,w]=(0,n.useState)({}),Z=(0,n.useMemo)(()=>a.filter(e=>(0,v.V5)(e,g)&&(0,v.jJ)(e,f)&&(0,v.aj)(e,k)),[a,g,f,k]),C=(0,n.useMemo)(()=>[...Z].sort((e,a)=>"asc"===p?new Date(e.date).getTime()-new Date(a.date).getTime():new Date(a.date).getTime()-new Date(e.date).getTime()),[Z,p]),S=(0,n.useMemo)(()=>C.slice((d-1)*o,d*o),[C,d,o]),P=(0,n.useCallback)(e=>{D(e),u(1)},[]),G=(0,n.useCallback)(e=>{y(e),u(1)},[]),T=(0,n.useCallback)(e=>{m(e),u(1)},[]),L=(0,n.useCallback)(e=>{w(e),u(1)},[]);return(0,s.jsxs)(c.Z,{className:"mt-5",style:{maxWidth:"800px"},children:[(0,s.jsx)(R,{searchQuery:g,onSearchChange:j,sortOrder:p,onSortChange:P,selectedTopics:f,onTopicsChange:G,onDateRangeChange:L,topics:t}),S.length>0?S.map(e=>(0,s.jsx)(b,{post:e},e.id)):(0,s.jsxs)(l.Z,{variant:"warning",className:"mb-0 d-flex align-items-center justify-content-center py-3",children:[(0,s.jsx)(N.G,{icon:"exclamation-circle",className:"me-2",size:"lg"}),null!=i?i:r("post.noPostsFound")]}),C.length>0&&(0,s.jsx)(h,{currentPage:d,totalPages:Math.ceil(C.length/o),size:o,onPageChange:u,onSizeChange:T,totalResults:C.length})]})}}}]);