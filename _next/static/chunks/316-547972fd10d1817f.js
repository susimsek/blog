"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[316],{92285:(e,a,t)=>{t.d(a,{Z:()=>n});var s=t(85893),c=t(25675),l=t.n(c);function n(e){let{src:a,alt:t,width:c=800,height:n=600,className:i="",priority:r=!0}=e;return(0,s.jsx)("div",{className:"image-wrapper text-center mb-4 ".concat(i),children:(0,s.jsx)(l(),{src:a,alt:t,className:"img-fluid rounded",width:c,height:n,style:{width:"100%",height:"auto"},priority:r})})}},33316:(e,a,t)=>{t.d(a,{Z:()=>B});var s=t(85893),c=t(67294),l=t(97375),n=t(70525),i=t(19101),r=t(68070),o=t(81954),m=t(21351);let d=e=>{let{size:a=5,pageSizeOptions:t=[5,10,20],onSizeChange:c,className:l=""}=e;return(0,s.jsxs)("fieldset",{className:"d-flex align-items-center ".concat(l),children:[(0,s.jsx)("legend",{className:"visually-hidden",children:"Page size selector"}),(0,s.jsx)(m.Z.Label,{htmlFor:"postsPerPageSelect",className:"me-2 mb-0",children:"Page size:"}),(0,s.jsx)(m.Z.Select,{id:"postsPerPageSelect",className:"mb-0",value:a,onChange:e=>c(Number(e.target.value)),style:{width:"100px"},children:t.map(e=>(0,s.jsx)("option",{value:e,children:e},e))})]})};var x=t(48352);function h(e){let{currentPage:a,totalPages:t,totalResults:c,size:n,pageSizeOptions:m=[5,10,20],maxPagesToShow:h=5,onPageChange:u,onSizeChange:g}=e,{t:j}=(0,x.$G)("common"),p=Math.min(a*n,c);return(0,s.jsx)(l.Z,{className:"pagination-bar",children:(0,s.jsxs)(i.Z,{className:"align-items-center justify-content-between flex-wrap gy-3",children:[(0,s.jsx)(r.Z,{xs:12,md:"auto",className:"d-flex justify-content-center flex-wrap",children:(0,s.jsx)(o.Z,{className:"pagination mb-0",currentPage:a,totalPages:t,onPageChange:u,maxPagesToShow:h})}),(0,s.jsx)(r.Z,{xs:12,md:!0,className:"d-flex align-items-center justify-content-center justify-content-md-start",children:(0,s.jsx)("p",{className:"text-muted mb-0 text-nowrap",children:j("common.pagination.showingResults",{start:(a-1)*n+1,end:p,total:c})})}),(0,s.jsx)(r.Z,{xs:12,md:"auto",className:"d-flex align-items-center justify-content-center justify-content-md-end",children:(0,s.jsx)(d,{size:n,pageSizeOptions:m,onSizeChange:g})})]})})}var u=t(27749),g=t(53280),j=t(76720),p=t(97143),f=t(70270),D=t(92285),N=t(67814);function b(e){let{post:a}=e,{id:t,title:c,date:l,summary:n,thumbnail:i,topics:r,readingTime:o}=a,{t:m}=(0,x.$G)("post");return(0,s.jsx)("div",{className:"post-card d-flex align-items-center mb-4",children:(0,s.jsxs)("div",{className:"post-card-content flex-grow-1",children:[(0,s.jsx)("h2",{className:"fw-bold mb-4",children:(0,s.jsx)(u.Z,{href:"/posts/".concat(t),className:"link",children:c})}),(0,s.jsxs)("p",{className:"d-flex align-items-center",children:[(0,s.jsxs)(u.Z,{href:"/posts/".concat(t),className:"link-muted d-flex align-items-center me-3",children:[(0,s.jsx)(N.G,{icon:"calendar-alt",className:"me-2"}),(0,s.jsx)(p.Z,{date:l})]}),(0,s.jsxs)("span",{className:"text-muted d-flex align-items-center",children:[(0,s.jsx)(N.G,{icon:"clock",className:"me-2"}),o]})]}),r&&r.length>0&&(0,s.jsx)("div",{className:"mb-4",children:r.map(e=>(0,s.jsx)(u.Z,{href:"/topics/".concat(e.id),children:(0,s.jsx)(g.Z,{bg:e.color,className:"me-2 badge-".concat(e.color),children:e.name})},e.id))}),i&&(0,s.jsx)(u.Z,{href:"/posts/".concat(t),children:(0,s.jsx)(D.Z,{className:"thumbnail-wrapper",src:"".concat(f.Vc).concat(i),alt:c,width:800,height:600})}),(0,s.jsx)("p",{className:"mb-4",children:n}),(0,s.jsx)("div",{className:"mb-4",children:(0,s.jsx)(u.Z,{href:"/posts/".concat(t),children:(0,s.jsx)(j.Z,{className:"primary",children:m("post.readMore")})})})]})})}var v=t(47340),y=t(85742),k=t(41874);function Z(e){let{sortOrder:a,onChange:t}=e,{t:c}=(0,x.$G)("common");return(0,s.jsxs)(y.Z,{id:"sort-dropdown",variant:"green",className:"mb-2",align:"start",flip:!1,title:(0,s.jsxs)("span",{children:[(0,s.jsx)(N.G,{icon:"sort",className:"me-2"}),c("asc"===a?"common.sort.oldest":"common.sort.newest")]}),onSelect:e=>e&&t(e),children:[(0,s.jsxs)(k.Z.Item,{eventKey:"desc",children:[c("common.sort.newest"),"desc"===a&&(0,s.jsx)(N.G,{icon:"circle-check",className:"ms-2 circle-check"})]}),(0,s.jsxs)(k.Z.Item,{eventKey:"asc",children:[c("common.sort.oldest"),"asc"===a&&(0,s.jsx)(N.G,{icon:"circle-check",className:"ms-2 circle-check"})]})]})}var w=t(98794),C=t(15561);function S(e){let{topics:a,selectedTopics:t,onTopicsChange:l}=e,{t:i}=(0,x.$G)(["common","topic"]),[r,m]=(0,c.useState)(""),[d,h]=(0,c.useState)(1),[u,p]=(0,c.useState)(!1),[f,D]=(0,c.useState)(t),b=(0,C.Z)(r,500),v=(0,c.useMemo)(()=>a.filter(e=>e.name.toLowerCase().includes(b.toLowerCase().trim())),[a,b]),Z=(0,c.useMemo)(()=>v.slice((d-1)*5,5*d),[v,d,5]),S=(0,c.useMemo)(()=>{if(0===t.length)return i("topic:topic.allTopics");if(t.length>3){let e=t.slice(0,3).map(e=>{var t;return null===(t=a.find(a=>a.id===e))||void 0===t?void 0:t.name}).filter(Boolean).join(", ");return"".concat(e," ").concat(i("common.andMore",{count:t.length-3}))}return t.map(e=>{var t;return null===(t=a.find(a=>a.id===e))||void 0===t?void 0:t.name}).filter(Boolean).join(", ")},[t,a,i]),P=(0,c.useCallback)(e=>{m(e),h(1)},[]),G=(0,c.useCallback)(e=>{h(e)},[]),L=(0,c.useCallback)(e=>{f.includes(e)||D([...f,e])},[f]),T=(0,c.useCallback)(()=>{D([]),p(!1),l([])},[D,p,l]),M=(0,c.useCallback)(e=>{D(f.filter(a=>a!==e))},[f]),z=(0,c.useCallback)(()=>{l(f),p(!1)},[f,l]);return(0,s.jsxs)(y.Z,{id:"topics-dropdown",variant:"gray",className:"mb-2 topics-dropdown",flip:!1,align:"start",title:(0,s.jsxs)("span",{children:[(0,s.jsx)(N.G,{icon:"tags",className:"me-2"}),S]}),show:u,onToggle:e=>{p(e),e||D(t)},autoClose:"outside",children:[(0,s.jsx)("div",{className:"p-2",children:(0,s.jsx)(w.Z,{query:r,onChange:P,className:"w-100"})}),(0,s.jsx)(k.Z.Divider,{}),f.length>0&&(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(k.Z.Header,{children:(0,s.jsxs)("div",{className:"d-flex justify-content-between align-items-center",children:[(0,s.jsx)("span",{children:i("topic:topic.selectedTopics")}),(0,s.jsxs)(j.Z,{variant:"danger",onClick:T,className:"btn-badge",children:[(0,s.jsx)(N.G,{icon:"trash",className:"me-2"}),i("common.clearAll")]})]})}),(0,s.jsx)("div",{className:"p-2 ms-2",children:f.map(e=>{let t=a.find(a=>a.id===e);return t?(0,s.jsxs)(g.Z,{bg:t.color,className:"badge-".concat(t.color," me-2 mb-2"),children:[t.name," ",(0,s.jsx)(N.G,{icon:"times",className:"ms-1 cursor-pointer",onClick:()=>M(e)})]},e):null})}),(0,s.jsx)(k.Z.Divider,{})]}),(0,s.jsxs)(k.Z.Item,{className:"d-flex align-items-center",onClick:T,children:[(0,s.jsx)(g.Z,{bg:"gray",className:"badge-gray me-2",children:i("topic:topic.allTopics")}),0===f.length&&(0,s.jsx)(N.G,{icon:"circle-check",className:"ms-auto"})]}),Z.length>0?Z.map(e=>(0,s.jsxs)(k.Z.Item,{onClick:()=>L(e.id),className:"d-flex align-items-center",children:[(0,s.jsx)(g.Z,{bg:e.color,className:"badge-".concat(e.color," me-2"),children:e.name}),f.includes(e.id)&&(0,s.jsx)(N.G,{icon:"circle-check",className:"ms-auto"})]},e.id)):(0,s.jsx)(k.Z.Item,{className:"text-center py-3",children:(0,s.jsxs)(n.Z,{variant:"warning",className:"mb-0 d-flex align-items-center",children:[(0,s.jsx)(N.G,{icon:"exclamation-circle",className:"me-2",size:"lg"}),i("topic:topic.noTopicFound")]})}),v.length>0&&(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(k.Z.Divider,{}),(0,s.jsx)("div",{className:"d-flex justify-content-center p-2",children:(0,s.jsx)(o.Z,{currentPage:d,totalPages:Math.ceil(v.length/5),maxPagesToShow:5,onPageChange:G})})]}),(0,s.jsx)(k.Z.Divider,{}),(0,s.jsx)("div",{className:"d-flex justify-content-center p-2",children:(0,s.jsxs)(j.Z,{className:"apply-button",variant:"success",disabled:0===t.length&&0===f.length,onClick:z,children:[(0,s.jsx)(N.G,{icon:"check",className:"me-2"}),i("common.datePicker.applySelection")]})})]})}var P=t(34421),G=t.n(P),L=t(11163),T=t(9198),M=t.n(T),z=t(18647),_=t(75104);t(58837);var F=t(87536),q=t(47533),E=t(16310);let I=e=>E.Ry().shape({startDate:E.hT().required(e("common.validation.required")).typeError(e("common.validation.datetimelocal")).test("startDateBeforeEndDate",e("common.validation.startDateAfterEndDate"),function(e){let{endDate:a}=this.parent;return!(e&&a&&e>a)}),endDate:E.hT().required(e("common.validation.required")).typeError(e("common.validation.datetimelocal")).test("endDateAfterStartDate",e("common.validation.endDateBeforeStartDate"),function(e){let{startDate:a}=this.parent;return!(e&&a&&e<a)})});function R(e){var a;let{onRangeChange:t,minDate:l=new Date("2024-01-01"),maxDate:n=new Date}=e,{t:i}=(0,x.$G)("common"),r=null!==(a=(0,L.useRouter)().query.locale)&&void 0!==a?a:G().i18n.defaultLocale,o={en:z._,tr:_.tr}[r]||z._;(0,c.useMemo)(()=>{(0,T.registerLocale)("en",z._),(0,T.registerLocale)("tr",_.tr)},[]);let d=I(i),{handleSubmit:h,control:u,reset:g,getValues:p,clearErrors:f,formState:{errors:D}}=(0,F.cI)({resolver:(0,q.X)(d),defaultValues:{startDate:void 0,endDate:void 0}}),b=(0,c.useCallback)(e=>i("common.datePicker.".concat(e)),[i]),[v,Z]=(0,c.useState)(null),[w,C]=(0,c.useState)(!1),[S,P]=(0,c.useState)(!1),E=(0,c.useMemo)(()=>{if("customDate"===v){if(S){let{startDate:e,endDate:a}=p(),t=e?e.toLocaleDateString():"",s=a?a.toLocaleDateString():"";return t&&s?"".concat(t," - ").concat(s):b("customDate")}return b("customDate")}return v?b(v):b("selectDate")},[v,S,p,b]),R=(e,a)=>{let s,c;if(a&&"customDate"===e&&(a.preventDefault(),a.stopPropagation()),"customDate"===e&&!S){Z(e);return}"customDate"!==e&&C(!1),Z(e);let l=new Date;switch(e){case"today":{let e=l.toLocaleDateString();s=e,c=e;break}case"yesterday":{let e=new Date(l);e.setDate(l.getDate()-1),s=e.toLocaleDateString(),c=e.toLocaleDateString();break}case"last7Days":{let e=new Date(l);e.setDate(l.getDate()-7),s=e.toLocaleDateString(),c=l.toLocaleDateString();break}case"last30Days":{let e=new Date(l);e.setDate(l.getDate()-30),s=e.toLocaleDateString(),c=l.toLocaleDateString();break}case"customDate":{let{startDate:e,endDate:a}=p();s=e?e.toLocaleDateString():void 0,c=a?a.toLocaleDateString():void 0}}t({startDate:s,endDate:c})},$=!!v,B=new Date(l).setHours(0,0,0,0),O=new Date(n).setHours(23,59,59,999),A=e=>e.getTime()<B||e.getTime()>O?"react-datepicker__day--muted":"",H=[{key:"today",label:b("today")},{key:"yesterday",label:b("yesterday")},{key:"last7Days",label:b("last7Days")},{key:"last30Days",label:b("last30Days")},{key:"customDate",label:b("customDate")}];return(0,s.jsx)(m.Z,{onSubmit:h(e=>{if("customDate"===v){var a,s;t({startDate:null===(a=e.startDate)||void 0===a?void 0:a.toLocaleDateString(),endDate:null===(s=e.endDate)||void 0===s?void 0:s.toLocaleDateString()})}P(!0),C(!1)}),children:(0,s.jsxs)(y.Z,{id:"date-range-dropdown",variant:"orange",className:"date-picker-dropdown mb-2",align:"start",flip:!1,title:(0,s.jsxs)("span",{children:[(0,s.jsx)(N.G,{icon:"calendar-alt",className:"me-2"}),E]}),show:w,onToggle:e=>{C(e),e||P(!1)},autoClose:"outside",children:[H.map(e=>(0,s.jsxs)(k.Z.Item,{onClick:a=>R(e.key,a),className:"d-flex justify-content-between align-items-center",children:[e.label,v===e.key&&(0,s.jsx)(N.G,{icon:"circle-check",className:"circle-check ms-2"})]},e.key)),"customDate"===v&&(0,s.jsxs)("div",{className:"p-3",children:[(0,s.jsxs)("div",{className:"d-flex flex-column mb-4",children:[(0,s.jsx)(m.Z.Label,{className:"mb-2",children:i("common.datePicker.startDateLabel")}),(0,s.jsxs)("div",{className:"d-flex align-items-center",children:[(0,s.jsx)(N.G,{icon:"calendar-alt",className:"me-2"}),(0,s.jsx)(F.Qr,{name:"startDate",control:u,render:e=>{let{field:{onChange:a,value:t}}=e;return(0,s.jsx)(M(),{selected:t,onChange:e=>{a(e),f()},locale:o,dateFormat:"P",isClearable:!0,className:"form-control",placeholderText:i("common.datePicker.startDatePlaceholder"),minDate:l,maxDate:n,dayClassName:A})}})]}),D.startDate&&(0,s.jsx)(m.Z.Text,{className:"text-danger mt-2",children:D.startDate.message})]}),(0,s.jsxs)("div",{className:"d-flex flex-column mb-4",children:[(0,s.jsx)(m.Z.Label,{className:"mb-2",children:i("common.datePicker.endDateLabel")}),(0,s.jsxs)("div",{className:"d-flex align-items-center",children:[(0,s.jsx)(N.G,{icon:"calendar-alt",className:"me-2"}),(0,s.jsx)(F.Qr,{name:"endDate",control:u,render:e=>{let{field:{onChange:a,value:t}}=e;return(0,s.jsx)(M(),{selected:t,onChange:e=>{a(e),f()},locale:o,dateFormat:"P",isClearable:!0,className:"form-control",placeholderText:i("common.datePicker.endDatePlaceholder"),minDate:l,maxDate:n,dayClassName:A})}})]}),D.endDate&&(0,s.jsx)(m.Z.Text,{className:"text-danger mt-2",children:D.endDate.message})]}),(0,s.jsx)("div",{className:"d-flex align-items-center",children:(0,s.jsxs)(j.Z,{variant:"success",type:"submit",size:"sm",className:"date-picker-button",children:[(0,s.jsx)(N.G,{icon:"check",className:"me-2"}),i("common.datePicker.applySelection")]})})]}),$&&(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(k.Z.Divider,{}),(0,s.jsx)("div",{className:"date-picker-clear-button-container",children:(0,s.jsxs)(j.Z,{variant:"danger",onClick:()=>{g(),Z(null),t({startDate:void 0,endDate:void 0}),C(!1)},size:"sm",className:"date-picker-button",children:[(0,s.jsx)(N.G,{icon:"times",className:"me-2"}),i("common.datePicker.clearSelection")]})})]})]})})}function $(e){let{searchQuery:a,onSearchChange:t,sortOrder:c,onSortChange:l,selectedTopics:n,onTopicsChange:i,onDateRangeChange:r,topics:o=[],searchEnabled:m=!0}=e;return(0,s.jsxs)("div",{className:"d-flex flex-wrap align-items-center mb-3",children:[m&&(0,s.jsx)("div",{className:"flex-grow-1 mb-4",children:(0,s.jsx)(w.Z,{query:a,onChange:t})}),(0,s.jsxs)("div",{className:"d-flex flex-column flex-md-row align-items-stretch w-100 w-md-auto",style:{gap:"10px"},children:[o.length>0&&(0,s.jsx)(S,{topics:o,selectedTopics:n,onTopicsChange:i}),(0,s.jsx)(R,{onRangeChange:r,minDate:new Date("2024-01-01"),maxDate:new Date}),(0,s.jsx)(Z,{sortOrder:c,onChange:l})]})]})}function B(e){let{posts:a,topics:t=[],noPostsFoundMessage:i,searchEnabled:r=!0}=e,{t:o}=(0,x.$G)(["post","common"]),[m,d]=(0,c.useState)(5),[u,g]=(0,c.useState)(1),[j,p]=(0,c.useState)(""),[f,D]=(0,c.useState)("desc"),[y,k]=(0,c.useState)([]),[Z,w]=(0,c.useState)({}),S=(0,C.Z)(j,500),P=(0,c.useMemo)(()=>a.filter(e=>(0,v.V5)(e,S)&&(0,v.jJ)(e,y)&&(0,v.aj)(e,Z)),[a,S,y,Z]),G=(0,c.useMemo)(()=>(0,v.O2)(P,f),[P,f]),L=(0,c.useMemo)(()=>G.slice((u-1)*m,u*m),[G,u,m]),T=(0,c.useCallback)(e=>{D(e),g(1)},[]),M=(0,c.useCallback)(e=>{k(e),g(1)},[]),z=(0,c.useCallback)(e=>{d(e),g(1)},[]),_=(0,c.useCallback)(e=>{w(e),g(1)},[]);return(0,s.jsxs)(l.Z,{className:"mt-5",style:{maxWidth:"800px"},children:[(0,s.jsx)($,{searchQuery:j,onSearchChange:p,sortOrder:f,onSortChange:T,selectedTopics:y,onTopicsChange:M,onDateRangeChange:_,topics:t,searchEnabled:r}),L.length>0?L.map(e=>(0,s.jsx)(b,{post:e},e.id)):(0,s.jsxs)(n.Z,{variant:"warning",className:"mb-0 d-flex align-items-center justify-content-center py-3",children:[(0,s.jsx)(N.G,{icon:"exclamation-circle",className:"me-2",size:"lg"}),null!=i?i:o("post.noPostsFound")]}),G.length>0&&(0,s.jsx)(h,{currentPage:u,totalPages:Math.ceil(G.length/m),size:m,onPageChange:g,onSizeChange:z,totalResults:G.length})]})}}}]);