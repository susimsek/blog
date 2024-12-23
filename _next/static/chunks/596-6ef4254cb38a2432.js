"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[596],{97143:(e,a,t)=>{t.d(a,{Z:()=>i});var s=t(85893);t(67294);var l=t(11163),c=t(34421),n=t.n(c);function i(e){var a;let{date:t,locale:c}=e,i=(0,l.useRouter)(),o=null!==(a=null!=c?c:i.query.locale)&&void 0!==a?a:n().i18n.defaultLocale;return(0,s.jsx)("span",{children:new Date(t).toLocaleDateString(o,{year:"numeric",month:"long",day:"numeric"})})}},92285:(e,a,t)=>{t.d(a,{Z:()=>n});var s=t(85893),l=t(25675),c=t.n(l);function n(e){let{src:a,alt:t,width:l=800,height:n=600,className:i="",priority:o=!0}=e;return(0,s.jsx)("div",{className:"image-wrapper text-center mb-4 ".concat(i),children:(0,s.jsx)(c(),{src:a,alt:t,className:"img-fluid rounded",width:l,height:n,style:{width:"100%",height:"auto"},priority:o})})}},75596:(e,a,t)=>{t.d(a,{Z:()=>I});var s=t(85893),l=t(67294),c=t(97375),n=t(70525),i=t(67814),o=t(48352);function r(e){let{query:a,onChange:t,className:c}=e,{t:n}=(0,o.$G)("common"),r=(0,l.useCallback)(e=>{t(e.target.value)},[t]),d=(0,l.useCallback)(()=>{t("")},[t]);return(0,s.jsxs)("div",{className:"search-bar d-flex align-items-center ".concat(null!=c?c:""),children:[(0,s.jsx)("div",{className:"search-icon",children:(0,s.jsx)(i.G,{icon:"search"})}),(0,s.jsx)("input",{type:"text",className:"search-input form-control",placeholder:n("common.searchBar.placeholder"),value:a,onChange:r}),a&&(0,s.jsx)("button",{className:"border-0 bg-transparent",onClick:d,children:(0,s.jsx)(i.G,{icon:"times-circle",className:"clear-icon"})})]})}var d=t(19101),m=t(68070),x=t(23933);let h=e=>{let{currentPage:a,totalPages:t,maxPagesToShow:l=5,onPageChange:c,className:n=""}=e,i=[],o=Math.max(1,Math.min(a-Math.floor(l/2),t-l+1)),r=Math.min(t,o+l-1);i.push((0,s.jsx)(x.Z.First,{disabled:1===a,onClick:()=>c(1)},"first"),(0,s.jsx)(x.Z.Prev,{disabled:1===a,onClick:()=>c(a-1)},"prev")),o>1&&(i.push((0,s.jsx)(x.Z.Item,{onClick:()=>c(1),children:"1"},1)),o>2&&i.push((0,s.jsx)(x.Z.Ellipsis,{disabled:!0},"start-ellipsis")));for(let e=o;e<=r;e++)i.push((0,s.jsx)(x.Z.Item,{active:e===a,onClick:()=>c(e),children:e},e));return r<t&&(r<t-1&&i.push((0,s.jsx)(x.Z.Ellipsis,{disabled:!0},"end-ellipsis")),i.push((0,s.jsx)(x.Z.Item,{onClick:()=>c(t),children:t},t))),i.push((0,s.jsx)(x.Z.Next,{disabled:a===t,onClick:()=>c(a+1)},"next"),(0,s.jsx)(x.Z.Last,{disabled:a===t,onClick:()=>c(t)},"last")),(0,s.jsx)(x.Z,{className:n,children:i})};var u=t(21351);let g=e=>{let{size:a=5,pageSizeOptions:t=[5,10,20],onSizeChange:l,className:c=""}=e;return(0,s.jsxs)("fieldset",{className:"d-flex align-items-center ".concat(c),children:[(0,s.jsx)("legend",{className:"visually-hidden",children:"Page size selector"}),(0,s.jsx)(u.Z.Label,{htmlFor:"postsPerPageSelect",className:"me-2 mb-0",children:"Page size:"}),(0,s.jsx)(u.Z.Select,{id:"postsPerPageSelect",className:"mb-0",value:a,onChange:e=>l(Number(e.target.value)),style:{width:"100px"},children:t.map(e=>(0,s.jsx)("option",{value:e,children:e},e))})]})};function j(e){let{currentPage:a,totalPages:t,totalResults:l,size:n,pageSizeOptions:i=[5,10,20],maxPagesToShow:r=5,onPageChange:x,onSizeChange:u}=e,{t:j}=(0,o.$G)("common"),p=Math.min(a*n,l);return(0,s.jsx)(c.Z,{className:"pagination-bar",children:(0,s.jsxs)(d.Z,{className:"align-items-center justify-content-between flex-wrap gy-3",children:[(0,s.jsx)(m.Z,{xs:12,md:"auto",className:"d-flex justify-content-center flex-wrap",children:(0,s.jsx)(h,{className:"pagination mb-0",currentPage:a,totalPages:t,onPageChange:x,maxPagesToShow:r})}),(0,s.jsx)(m.Z,{xs:12,md:!0,className:"d-flex align-items-center justify-content-center justify-content-md-start",children:(0,s.jsx)("p",{className:"text-muted mb-0 text-nowrap",children:j("common.pagination.showingResults",{start:(a-1)*n+1,end:p,total:l})})}),(0,s.jsx)(m.Z,{xs:12,md:"auto",className:"d-flex align-items-center justify-content-center justify-content-md-end",children:(0,s.jsx)(g,{size:n,pageSizeOptions:i,onSizeChange:u})})]})})}var p=t(27749),N=t(53280),f=t(76720),v=t(97143),b=t(70270),D=t(92285);function w(e){let{post:a}=e,{id:t,title:l,date:c,summary:n,thumbnail:i,topics:r}=a,{t:d}=(0,o.$G)("post");return(0,s.jsx)("div",{className:"post-card d-flex align-items-center mb-4",children:(0,s.jsxs)("div",{className:"post-card-content flex-grow-1",children:[(0,s.jsx)("h2",{className:"fw-bold mb-4",children:(0,s.jsx)(p.Z,{href:"/posts/".concat(t),className:"link",children:l})}),(0,s.jsx)("p",{className:"text-muted",children:(0,s.jsx)(p.Z,{href:"/posts/".concat(t),children:(0,s.jsx)(v.Z,{date:c})})}),r&&r.length>0&&(0,s.jsx)("div",{className:"mb-4",children:r.map(e=>(0,s.jsx)(p.Z,{href:"/topics/".concat(e.id),children:(0,s.jsx)(N.Z,{bg:e.color,className:"me-2 badge-".concat(e.color),children:e.name})},e.id))}),i&&(0,s.jsx)(p.Z,{href:"/posts/".concat(t),children:(0,s.jsx)(D.Z,{className:"thumbnail-wrapper",src:"".concat(b.Vc).concat(i),alt:l,width:800,height:600})}),(0,s.jsx)("p",{className:"mb-4",children:n}),(0,s.jsx)("div",{className:"mb-4",children:(0,s.jsx)(p.Z,{href:"/posts/".concat(t),children:(0,s.jsx)(f.Z,{className:"primary",children:d("post.readMore")})})})]})})}var k=t(85742),Z=t(41874);function C(e){let{sortOrder:a,onChange:t}=e,{t:l}=(0,o.$G)("common");return(0,s.jsxs)(k.Z,{id:"sort-dropdown",variant:"green",className:"mb-2",align:"start",flip:!1,title:(0,s.jsxs)("span",{children:[(0,s.jsx)(i.G,{icon:"sort",className:"me-2"}),l("asc"===a?"common.sort.oldest":"common.sort.newest")]}),onSelect:e=>e&&t(e),children:[(0,s.jsxs)(Z.Z.Item,{eventKey:"desc",children:[l("common.sort.newest"),"desc"===a&&(0,s.jsx)(i.G,{icon:"circle-check",className:"ms-2 circle-check"})]}),(0,s.jsxs)(Z.Z.Item,{eventKey:"asc",children:[l("common.sort.oldest"),"asc"===a&&(0,s.jsx)(i.G,{icon:"circle-check",className:"ms-2 circle-check"})]})]})}function y(e){let{topics:a,selectedTopics:t,onTopicsChange:c}=e,{t:d}=(0,o.$G)(["common","topic"]),[m,x]=(0,l.useState)(""),[u,g]=(0,l.useState)(1),j=(0,l.useMemo)(()=>a.filter(e=>e.name.toLowerCase().includes(m.toLowerCase().trim())),[a,m]),p=(0,l.useMemo)(()=>j.slice((u-1)*5,5*u),[j,u,5]),v=(0,l.useMemo)(()=>{if(0===t.length)return d("topic:topic.allTopics");if(t.length>3){let e=t.slice(0,3).map(e=>{var t;return null===(t=a.find(a=>a.id===e))||void 0===t?void 0:t.name}).filter(Boolean).join(", ");return"".concat(e," ").concat(d("common.andMore",{count:t.length-3}))}return t.map(e=>{var t;return null===(t=a.find(a=>a.id===e))||void 0===t?void 0:t.name}).filter(Boolean).join(", ")},[t,a,d]),b=(0,l.useCallback)(e=>{x(e),g(1)},[]),D=(0,l.useCallback)(e=>{g(e)},[]),w=(0,l.useCallback)(e=>{c(t.includes(e)?t.filter(a=>a!==e):[...t,e]),x(""),g(1)},[t,c]),C=(0,l.useCallback)(e=>{c(t.filter(a=>a!==e))},[t,c]);return(0,s.jsxs)(k.Z,{id:"topics-dropdown",variant:"gray",className:"mb-2 topics-dropdown",flip:!1,align:"start",title:(0,s.jsxs)("span",{children:[(0,s.jsx)(i.G,{icon:"tags",className:"me-2"}),v]}),autoClose:"outside",children:[(0,s.jsx)("div",{className:"p-2",children:(0,s.jsx)(r,{query:m,onChange:b,className:"w-100"})}),(0,s.jsx)(Z.Z.Divider,{}),t.length>0&&(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(Z.Z.Header,{children:(0,s.jsxs)("div",{className:"d-flex justify-content-between align-items-center",children:[(0,s.jsx)("span",{children:d("topic:topic.selectedTopics")}),(0,s.jsxs)(f.Z,{variant:"danger",onClick:()=>c([]),className:"btn-badge",children:[(0,s.jsx)(i.G,{icon:"trash",className:"me-1"}),d("common.clearAll")]})]})}),(0,s.jsx)("div",{className:"p-2 ms-2",children:t.map(e=>{let t=a.find(a=>a.id===e);return t?(0,s.jsxs)(N.Z,{bg:t.color,className:"badge-".concat(t.color," me-2 mb-2"),children:[t.name," ",(0,s.jsx)(i.G,{icon:"times",className:"ms-1 cursor-pointer",onClick:()=>C(e)})]},e):null})}),(0,s.jsx)(Z.Z.Divider,{})]}),(0,s.jsxs)(Z.Z.Item,{onClick:()=>c([]),className:"d-flex align-items-center",children:[(0,s.jsx)(N.Z,{bg:"gray",className:"badge-gray me-2",children:d("topic:topic.allTopics")}),0===t.length&&(0,s.jsx)(i.G,{icon:"circle-check",className:"ms-auto"})]}),p.length>0?p.map(e=>(0,s.jsxs)(Z.Z.Item,{onClick:()=>w(e.id),className:"d-flex align-items-center",children:[(0,s.jsx)(N.Z,{bg:e.color,className:"badge-".concat(e.color," me-2"),children:e.name}),t.includes(e.id)&&(0,s.jsx)(i.G,{icon:"circle-check",className:"ms-auto"})]},e.id)):(0,s.jsx)(Z.Z.Item,{className:"text-center py-3",children:(0,s.jsxs)(n.Z,{variant:"warning",className:"mb-0 d-flex align-items-center",children:[(0,s.jsx)(i.G,{icon:"exclamation-circle",className:"me-2",size:"lg"}),d("topic:topic.noTopicFound")]})}),j.length>0&&(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(Z.Z.Divider,{}),(0,s.jsx)("div",{className:"d-flex justify-content-center p-2",children:(0,s.jsx)(h,{currentPage:u,totalPages:Math.ceil(j.length/5),maxPagesToShow:5,onPageChange:D})})]})]})}var S=t(34421),P=t.n(S),L=t(11163),G=t(9198),M=t.n(G),T=t(18647),z=t(75104);function F(e){var a;let{onRangeChange:t,minDate:c=new Date("2024-01-01"),maxDate:n=new Date}=e,{t:r}=(0,o.$G)("common"),d=null!==(a=(0,L.useRouter)().query.locale)&&void 0!==a?a:P().i18n.defaultLocale,m={en:T._,tr:z.tr}[d]||T._;(0,l.useMemo)(()=>{(0,G.registerLocale)("en",T._),(0,G.registerLocale)("tr",z.tr)},[]);let[x,h]=(0,l.useState)(null),[g,j]=(0,l.useState)(null),[p,N]=(0,l.useState)(null),v=(0,l.useMemo)(()=>{if("customDate"===x){let e=g?g.toLocaleDateString(d):"",a=p?p.toLocaleDateString(d):"";return e&&a?"".concat(e," - ").concat(a):r("common.datePicker.customDate")}return x?r("common.datePicker.".concat(x)):r("common.datePicker.selectDate")},[x,g,p,d,r]),b=e=>{let a,s;h(e);let l=new Date;switch(e){case"today":a=l.toLocaleDateString(),s=l.toLocaleDateString();break;case"yesterday":let c=new Date(l);c.setDate(l.getDate()-1),a=c.toLocaleDateString(),s=c.toLocaleDateString();break;case"last7Days":let n=new Date(l);n.setDate(l.getDate()-7),a=n.toLocaleDateString(),s=l.toLocaleDateString();break;case"last30Days":let i=new Date(l);i.setDate(l.getDate()-30),a=i.toLocaleDateString(),s=l.toLocaleDateString();break;case"customDate":a=g?g.toLocaleDateString():void 0,s=p?p.toLocaleDateString():void 0;break;default:a=void 0,s=void 0}t({startDate:a,endDate:s})},D=(e,a)=>{j(e),N(a),"customDate"===x&&t({startDate:null==e?void 0:e.toLocaleDateString(),endDate:null==a?void 0:a.toLocaleDateString()})},w=!!x;return(0,s.jsxs)(k.Z,{id:"date-range-dropdown",variant:"orange",className:"date-picker-dropdown mb-2",align:"start",flip:!1,title:(0,s.jsxs)("span",{children:[(0,s.jsx)(i.G,{icon:"calendar-alt",className:"me-2"}),v]}),autoClose:"outside",children:[["today","yesterday","last7Days","last30Days","customDate"].map(e=>(0,s.jsxs)(Z.Z.Item,{onClick:()=>b(e),className:"d-flex justify-content-between align-items-center",children:[r("common.datePicker.".concat(e)),x===e&&(0,s.jsx)(i.G,{icon:"circle-check",className:"circle-check ms-2"})]},e)),"customDate"===x&&(0,s.jsxs)("div",{className:"p-3",children:[(0,s.jsxs)("div",{className:"d-flex flex-column mb-4",children:[(0,s.jsx)(u.Z.Label,{className:"mb-2",children:r("common.datePicker.startDateLabel")}),(0,s.jsxs)("div",{className:"d-flex align-items-center",children:[(0,s.jsx)(i.G,{icon:"calendar-alt",className:"me-2"}),(0,s.jsx)(M(),{selected:g,onChange:e=>D(e,p),locale:m,dateFormat:"P",isClearable:!0,placeholderText:r("common.datePicker.startDatePlaceholder"),className:"form-control",minDate:c,maxDate:n})]})]}),(0,s.jsxs)("div",{className:"d-flex flex-column",children:[(0,s.jsx)(u.Z.Label,{className:"mb-2",children:r("common.datePicker.endDateLabel")}),(0,s.jsxs)("div",{className:"d-flex align-items-center",children:[(0,s.jsx)(i.G,{icon:"calendar-alt",className:"me-2"}),(0,s.jsx)(M(),{selected:p,onChange:e=>D(g,e),locale:m,dateFormat:"P",isClearable:!0,placeholderText:r("common.datePicker.endDatePlaceholder"),className:"form-control",minDate:c,maxDate:n})]})]})]}),w&&(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(Z.Z.Divider,{}),(0,s.jsx)("div",{className:"date-picker-clear-button-container",children:(0,s.jsxs)(f.Z,{variant:"danger",onClick:()=>{h(null),j(null),N(null),t({startDate:void 0,endDate:void 0})},size:"sm",className:"date-picker-clear-button",children:[(0,s.jsx)(i.G,{icon:"times",className:"me-2"}),r("common.datePicker.clearSelection")]})})]})]})}function I(e){let{posts:a,topics:t=[],noPostsFoundMessage:d}=e,{t:m}=(0,o.$G)(["post","common"]),[x,h]=(0,l.useState)(5),[u,g]=(0,l.useState)(1),[p,N]=(0,l.useState)(""),[f,v]=(0,l.useState)("desc"),[b,D]=(0,l.useState)([]),[k,Z]=(0,l.useState)([void 0,void 0]),S=(0,l.useMemo)(()=>a.filter(e=>{var a;let t=new Date(e.date),s=k[0]?new Date(k[0]):void 0,l=k[1]?new Date(k[1]):void 0;s&&s.setHours(0,0,0,0),l&&l.setHours(23,59,59,999);let c=e.title.toLowerCase().includes(p.toLowerCase())||e.summary.toLowerCase().includes(p.toLowerCase()),n=0===b.length||(null===(a=e.topics)||void 0===a?void 0:a.some(e=>b.includes(e.id))),i=(!s||t>=s)&&(!l||t<=l);return c&&n&&i}),[a,p,b,k]),P=(0,l.useMemo)(()=>[...S].sort((e,a)=>"asc"===f?new Date(e.date).getTime()-new Date(a.date).getTime():new Date(a.date).getTime()-new Date(e.date).getTime()),[S,f]),L=(0,l.useMemo)(()=>P.slice((u-1)*x,u*x),[P,u,x]),G=(0,l.useCallback)(e=>{v(e),g(1)},[]),M=(0,l.useCallback)(e=>{D(e),g(1)},[]),T=(0,l.useCallback)(e=>{h(e),g(1)},[]),z=(0,l.useCallback)(e=>{Z([e.startDate?new Date(e.startDate):void 0,e.endDate?new Date(e.endDate):void 0]),g(1)},[]);return(0,s.jsxs)(c.Z,{className:"mt-5",style:{maxWidth:"800px"},children:[(0,s.jsxs)("div",{className:"d-flex flex-wrap align-items-center mb-3",children:[(0,s.jsx)("div",{className:"flex-grow-1 mb-4",children:(0,s.jsx)(r,{query:p,onChange:N})}),(0,s.jsxs)("div",{className:"d-flex flex-column flex-md-row align-items-stretch w-100 w-md-auto",style:{gap:"10px"},children:[t.length>0&&(0,s.jsx)(y,{topics:t,selectedTopics:b,onTopicsChange:M}),(0,s.jsx)(F,{onRangeChange:e=>z(e),minDate:new Date("2024-01-01"),maxDate:new Date}),(0,s.jsx)(C,{sortOrder:f,onChange:G})]})]}),L.length>0?L.map(e=>(0,s.jsx)(w,{post:e},e.id)):(0,s.jsxs)(n.Z,{variant:"warning",className:"mb-0 d-flex align-items-center justify-content-center py-3",children:[(0,s.jsx)(i.G,{icon:"exclamation-circle",className:"me-2",size:"lg"}),null!=d?d:m("post.noPostsFound")]}),P.length>0&&(0,s.jsx)(j,{currentPage:u,totalPages:Math.ceil(P.length/x),size:x,onPageChange:g,onSizeChange:T,totalResults:P.length})]})}t(58837)}}]);