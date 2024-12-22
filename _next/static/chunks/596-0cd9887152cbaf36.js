"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[596],{97143:(e,t,a)=>{a.d(t,{Z:()=>i});var s=a(85893);a(67294);var l=a(11163),n=a(34421),c=a.n(n);function i(e){var t;let{date:a,locale:n}=e,i=(0,l.useRouter)(),r=null!==(t=null!=n?n:i.query.locale)&&void 0!==t?t:c().i18n.defaultLocale;return(0,s.jsx)("span",{children:new Date(a).toLocaleDateString(r,{year:"numeric",month:"long",day:"numeric"})})}},92285:(e,t,a)=>{a.d(t,{Z:()=>c});var s=a(85893),l=a(25675),n=a.n(l);function c(e){let{src:t,alt:a,width:l=800,height:c=600,className:i="",priority:r=!0}=e;return(0,s.jsx)("div",{className:"image-wrapper text-center mb-4 ".concat(i),children:(0,s.jsx)(n(),{src:t,alt:a,className:"img-fluid rounded",width:l,height:c,style:{width:"100%",height:"auto"},priority:r})})}},75596:(e,t,a)=>{a.d(t,{Z:()=>F});var s=a(85893),l=a(67294),n=a(97375),c=a(70525),i=a(67814),r=a(48352);function o(e){let{query:t,onChange:a,className:n}=e,{t:c}=(0,r.$G)("common"),o=(0,l.useCallback)(e=>{a(e.target.value)},[a]),d=(0,l.useCallback)(()=>{a("")},[a]);return(0,s.jsxs)("div",{className:"search-bar d-flex align-items-center ".concat(null!=n?n:""),children:[(0,s.jsx)("div",{className:"search-icon",children:(0,s.jsx)(i.G,{icon:"search"})}),(0,s.jsx)("input",{type:"text",className:"search-input form-control",placeholder:c("common.searchBar.placeholder"),value:t,onChange:o}),t&&(0,s.jsx)("button",{className:"border-0 bg-transparent",onClick:d,children:(0,s.jsx)(i.G,{icon:"times-circle",className:"clear-icon"})})]})}var d=a(19101),m=a(68070),h=a(23933);let u=e=>{let{currentPage:t,totalPages:a,maxPagesToShow:l=5,onPageChange:n,className:c=""}=e,i=[],r=Math.max(1,Math.min(t-Math.floor(l/2),a-l+1)),o=Math.min(a,r+l-1);i.push((0,s.jsx)(h.Z.First,{disabled:1===t,onClick:()=>n(1)},"first"),(0,s.jsx)(h.Z.Prev,{disabled:1===t,onClick:()=>n(t-1)},"prev")),r>1&&(i.push((0,s.jsx)(h.Z.Item,{onClick:()=>n(1),children:"1"},1)),r>2&&i.push((0,s.jsx)(h.Z.Ellipsis,{disabled:!0},"start-ellipsis")));for(let e=r;e<=o;e++)i.push((0,s.jsx)(h.Z.Item,{active:e===t,onClick:()=>n(e),children:e},e));return o<a&&(o<a-1&&i.push((0,s.jsx)(h.Z.Ellipsis,{disabled:!0},"end-ellipsis")),i.push((0,s.jsx)(h.Z.Item,{onClick:()=>n(a),children:a},a))),i.push((0,s.jsx)(h.Z.Next,{disabled:t===a,onClick:()=>n(t+1)},"next"),(0,s.jsx)(h.Z.Last,{disabled:t===a,onClick:()=>n(a)},"last")),(0,s.jsx)(h.Z,{className:c,children:i})};var x=a(21351);let g=e=>{let{size:t=5,pageSizeOptions:a=[5,10,20],onSizeChange:l,className:n=""}=e;return(0,s.jsxs)("fieldset",{className:"d-flex align-items-center ".concat(n),children:[(0,s.jsx)("legend",{className:"visually-hidden",children:"Page size selector"}),(0,s.jsx)(x.Z.Label,{htmlFor:"postsPerPageSelect",className:"me-2 mb-0",children:"Page size:"}),(0,s.jsx)(x.Z.Select,{id:"postsPerPageSelect",className:"mb-0",value:t,onChange:e=>l(Number(e.target.value)),style:{width:"100px"},children:a.map(e=>(0,s.jsx)("option",{value:e,children:e},e))})]})};function p(e){let{currentPage:t,totalPages:a,totalResults:l,size:c,pageSizeOptions:i=[5,10,20],maxPagesToShow:o=5,onPageChange:h,onSizeChange:x}=e,{t:p}=(0,r.$G)("common"),j=Math.min(t*c,l);return(0,s.jsx)(n.Z,{className:"pagination-bar",children:(0,s.jsxs)(d.Z,{className:"align-items-center justify-content-between flex-wrap gy-3",children:[(0,s.jsx)(m.Z,{xs:12,md:"auto",className:"d-flex justify-content-center flex-wrap",children:(0,s.jsx)(u,{className:"pagination mb-0",currentPage:t,totalPages:a,onPageChange:h,maxPagesToShow:o})}),(0,s.jsx)(m.Z,{xs:12,md:!0,className:"d-flex align-items-center justify-content-center justify-content-md-start",children:(0,s.jsx)("p",{className:"text-muted mb-0 text-nowrap",children:p("common.pagination.showingResults",{start:(t-1)*c+1,end:j,total:l})})}),(0,s.jsx)(m.Z,{xs:12,md:"auto",className:"d-flex align-items-center justify-content-center justify-content-md-end",children:(0,s.jsx)(g,{size:c,pageSizeOptions:i,onSizeChange:x})})]})})}var j=a(27749),v=a(53280),f=a(76720),N=a(97143),b=a(70270),D=a(92285);function k(e){let{post:t}=e,{id:a,title:l,date:n,summary:c,thumbnail:i,topics:o}=t,{t:d}=(0,r.$G)("post");return(0,s.jsx)("div",{className:"post-card d-flex align-items-center mb-4",children:(0,s.jsxs)("div",{className:"post-card-content flex-grow-1",children:[(0,s.jsx)("h2",{className:"fw-bold mb-4",children:(0,s.jsx)(j.Z,{href:"/posts/".concat(a),className:"link",children:l})}),(0,s.jsx)("p",{className:"text-muted",children:(0,s.jsx)(j.Z,{href:"/posts/".concat(a),children:(0,s.jsx)(N.Z,{date:n})})}),o&&o.length>0&&(0,s.jsx)("div",{className:"mb-4",children:o.map(e=>(0,s.jsx)(j.Z,{href:"/topics/".concat(e.id),children:(0,s.jsx)(v.Z,{bg:e.color,className:"me-2 badge-".concat(e.color),children:e.name})},e.id))}),i&&(0,s.jsx)(j.Z,{href:"/posts/".concat(a),children:(0,s.jsx)(D.Z,{className:"thumbnail-wrapper",src:"".concat(b.Vc).concat(i),alt:l,width:800,height:600})}),(0,s.jsx)("p",{className:"mb-4",children:c}),(0,s.jsx)("div",{className:"mb-4",children:(0,s.jsx)(j.Z,{href:"/posts/".concat(a),children:(0,s.jsx)(f.Z,{className:"primary",children:d("post.readMore")})})})]})})}var w=a(85742),Z=a(41874);function C(e){let{sortOrder:t,onChange:a}=e,{t:l}=(0,r.$G)("common");return(0,s.jsxs)(w.Z,{id:"sort-dropdown",variant:"primary",className:"mb-2",align:"start",flip:!1,title:l("asc"===t?"common.sort.oldest":"common.sort.newest"),onSelect:e=>e&&a(e),children:[(0,s.jsxs)(Z.Z.Item,{eventKey:"desc",children:[l("common.sort.newest"),"desc"===t&&(0,s.jsx)(i.G,{icon:"circle-check",className:"ms-2 circle-check"})]}),(0,s.jsxs)(Z.Z.Item,{eventKey:"asc",children:[l("common.sort.oldest"),"asc"===t&&(0,s.jsx)(i.G,{icon:"circle-check",className:"ms-2 circle-check"})]})]})}function y(e){let{topics:t,selectedTopics:a,onTopicsChange:n}=e,{t:d}=(0,r.$G)(["common","topic"]),[m,h]=(0,l.useState)(""),[x,g]=(0,l.useState)(1),p=(0,l.useMemo)(()=>t.filter(e=>e.name.toLowerCase().includes(m.toLowerCase().trim())),[t,m]),j=(0,l.useMemo)(()=>p.slice((x-1)*5,5*x),[p,x,5]),N=(0,l.useMemo)(()=>{if(0===a.length)return d("topic:topic.allTopics");if(a.length>3){let e=a.slice(0,3).map(e=>{var a;return null===(a=t.find(t=>t.id===e))||void 0===a?void 0:a.name}).filter(Boolean).join(", ");return"".concat(e," ").concat(d("common.andMore",{count:a.length-3}))}return a.map(e=>{var a;return null===(a=t.find(t=>t.id===e))||void 0===a?void 0:a.name}).filter(Boolean).join(", ")},[a,t,d]),b=(0,l.useCallback)(e=>{h(e),g(1)},[]),D=(0,l.useCallback)(e=>{g(e)},[]),k=(0,l.useCallback)(e=>{n(a.includes(e)?a.filter(t=>t!==e):[...a,e]),h(""),g(1)},[a,n]),C=(0,l.useCallback)(e=>{n(a.filter(t=>t!==e))},[a,n]);return(0,s.jsxs)(w.Z,{id:"topics-dropdown",variant:"primary",className:"mb-2 topics-dropdown",flip:!1,align:"start",title:N,autoClose:"outside",children:[(0,s.jsx)("div",{className:"p-2",children:(0,s.jsx)(o,{query:m,onChange:b,className:"w-100"})}),(0,s.jsx)(Z.Z.Divider,{}),a.length>0&&(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(Z.Z.Header,{children:(0,s.jsxs)("div",{className:"d-flex justify-content-between align-items-center",children:[(0,s.jsx)("span",{children:d("topic:topic.selectedTopics")}),(0,s.jsxs)(f.Z,{variant:"danger",onClick:()=>n([]),className:"btn-badge",children:[(0,s.jsx)(i.G,{icon:"trash",className:"me-1"}),d("common.clearAll")]})]})}),(0,s.jsx)("div",{className:"p-2 ms-2",children:a.map(e=>{let a=t.find(t=>t.id===e);return a?(0,s.jsxs)(v.Z,{bg:a.color,className:"badge-".concat(a.color," me-2 mb-2"),children:[a.name," ",(0,s.jsx)(i.G,{icon:"times",className:"ms-1 cursor-pointer",onClick:()=>C(e)})]},e):null})}),(0,s.jsx)(Z.Z.Divider,{})]}),(0,s.jsxs)(Z.Z.Item,{onClick:()=>n([]),className:"d-flex align-items-center",children:[(0,s.jsx)(v.Z,{bg:"gray",className:"badge-gray me-2",children:d("topic:topic.allTopics")}),0===a.length&&(0,s.jsx)(i.G,{icon:"circle-check",className:"ms-auto"})]}),j.length>0?j.map(e=>(0,s.jsxs)(Z.Z.Item,{onClick:()=>k(e.id),className:"d-flex align-items-center",children:[(0,s.jsx)(v.Z,{bg:e.color,className:"badge-".concat(e.color," me-2"),children:e.name}),a.includes(e.id)&&(0,s.jsx)(i.G,{icon:"circle-check",className:"ms-auto"})]},e.id)):(0,s.jsx)(Z.Z.Item,{className:"text-center py-3",children:(0,s.jsxs)(c.Z,{variant:"warning",className:"mb-0 d-flex align-items-center",children:[(0,s.jsx)(i.G,{icon:"exclamation-circle",className:"me-2",size:"lg"}),d("topic:topic.noTopicFound")]})}),p.length>0&&(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(Z.Z.Divider,{}),(0,s.jsx)("div",{className:"d-flex justify-content-center p-2",children:(0,s.jsx)(u,{currentPage:x,totalPages:Math.ceil(p.length/5),maxPagesToShow:5,onPageChange:D})})]})]})}var S=a(59417),P=a(34421),T=a.n(P),L=a(11163),I=a(9198),G=a.n(I),M=a(18647),z=a(75104);function O(e){var t;let{onRangeChange:a}=e,{t:n}=(0,r.$G)("common"),c=null!==(t=(0,L.useRouter)().query.locale)&&void 0!==t?t:T().i18n.defaultLocale,o={en:M._,tr:z.tr}[c]||M._;(0,l.useMemo)(()=>{(0,I.registerLocale)("en",M._),(0,I.registerLocale)("tr",z.tr)},[]);let[d,m]=(0,l.useState)(null),[h,u]=(0,l.useState)(null),[g,p]=(0,l.useState)(null),j=(0,l.useMemo)(()=>{if("customDate"===d){let e=h?h.toLocaleDateString(c):"",t=g?g.toLocaleDateString(c):"";return e&&t?"".concat(e," - ").concat(t):n("common.datePicker.customDate")}return d?n("common.datePicker.".concat(d)):n("common.datePicker.selectDate")},[d,h,g,c,n]),v=e=>{let t,s;m(e);let l=new Date;switch(e){case"today":t=l.toISOString().split("T")[0],s=l.toISOString().split("T")[0];break;case"last7Days":let n=new Date(l);n.setDate(l.getDate()-7),t=n.toISOString().split("T")[0],s=l.toISOString().split("T")[0];break;case"last30Days":let c=new Date(l);c.setDate(l.getDate()-30),t=c.toISOString().split("T")[0],s=l.toISOString().split("T")[0];break;case"customDate":t=null==h?void 0:h.toISOString().split("T")[0],s=null==g?void 0:g.toISOString().split("T")[0];break;default:t=void 0,s=void 0}a({startDate:t,endDate:s})},N=(e,t)=>{u(e),p(t),"customDate"===d&&a({startDate:null==e?void 0:e.toLocaleDateString(),endDate:null==t?void 0:t.toLocaleDateString()})},b=!!d;return(0,s.jsxs)(w.Z,{id:"date-range-dropdown",variant:"primary",className:"date-picker-dropdown mb-2",align:"start",flip:!1,title:j,autoClose:"outside",children:[(0,s.jsx)(Z.Z.Item,{onClick:()=>v("today"),children:n("common.datePicker.today")}),(0,s.jsx)(Z.Z.Item,{onClick:()=>v("last7Days"),children:n("common.datePicker.last7Days")}),(0,s.jsx)(Z.Z.Item,{onClick:()=>v("last30Days"),children:n("common.datePicker.last30Days")}),(0,s.jsx)(Z.Z.Item,{onClick:()=>v("customDate"),children:n("common.datePicker.customDate")}),"customDate"===d&&(0,s.jsxs)("div",{className:"p-3",children:[(0,s.jsxs)("div",{className:"d-flex align-items-center mb-4",children:[(0,s.jsx)(x.Z.Label,{style:{marginRight:"12px",minWidth:"100px"},children:n("common.datePicker.startDateLabel")}),(0,s.jsx)(G(),{selected:h,onChange:e=>N(e,g),locale:o,dateFormat:"P",isClearable:!0,placeholderText:n("common.datePicker.startDatePlaceholder"),className:"form-control",minDate:new Date("2024-01-01"),maxDate:new Date})]}),(0,s.jsxs)("div",{className:"d-flex align-items-center",children:[(0,s.jsx)(x.Z.Label,{style:{marginRight:"12px",minWidth:"100px"},children:n("common.datePicker.endDateLabel")}),(0,s.jsx)(G(),{selected:g,onChange:e=>N(h,e),locale:o,dateFormat:"P",isClearable:!0,placeholderText:n("common.datePicker.endDatePlaceholder"),className:"form-control",minDate:new Date("2024-01-01"),maxDate:new Date})]})]}),b&&(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(Z.Z.Divider,{}),(0,s.jsx)("div",{className:"date-picker-clear-button-container",children:(0,s.jsxs)(f.Z,{variant:"danger",onClick:()=>{m(null),u(null),p(null),a({startDate:void 0,endDate:void 0})},size:"sm",className:"date-picker-clear-button",children:[(0,s.jsx)(i.G,{icon:S.NBC,className:"me-2"}),n("common.datePicker.clearSelection")]})})]})]})}function F(e){let{posts:t,topics:a=[],noPostsFoundMessage:d}=e,{t:m}=(0,r.$G)(["post","common"]),[h,u]=(0,l.useState)(5),[x,g]=(0,l.useState)(1),[j,v]=(0,l.useState)(""),[f,N]=(0,l.useState)("desc"),[b,D]=(0,l.useState)([]),[w,Z]=(0,l.useState)([void 0,void 0]),S=(0,l.useMemo)(()=>t.filter(e=>{var t;let a=new Date(e.date),s=w[0]?new Date(w[0]):void 0,l=w[1]?new Date(w[1]):void 0;s&&s.setHours(0,0,0,0),l&&l.setHours(23,59,59,999);let n=e.title.toLowerCase().includes(j.toLowerCase())||e.summary.toLowerCase().includes(j.toLowerCase()),c=0===b.length||(null===(t=e.topics)||void 0===t?void 0:t.some(e=>b.includes(e.id))),i=(!s||a>=s)&&(!l||a<=l);return n&&c&&i}),[t,j,b,w]),P=(0,l.useMemo)(()=>[...S].sort((e,t)=>"asc"===f?new Date(e.date).getTime()-new Date(t.date).getTime():new Date(t.date).getTime()-new Date(e.date).getTime()),[S,f]),T=(0,l.useMemo)(()=>P.slice((x-1)*h,x*h),[P,x,h]),L=(0,l.useCallback)(e=>{N(e),g(1)},[]),I=(0,l.useCallback)(e=>{D(e),g(1)},[]),G=(0,l.useCallback)(e=>{u(e),g(1)},[]),M=(0,l.useCallback)(e=>{Z([e.startDate?new Date(e.startDate):void 0,e.endDate?new Date(e.endDate):void 0]),g(1)},[]);return(0,s.jsxs)(n.Z,{className:"mt-5",style:{maxWidth:"800px"},children:[(0,s.jsxs)("div",{className:"d-flex flex-wrap align-items-center mb-3",children:[(0,s.jsx)("div",{className:"flex-grow-1 mb-4",children:(0,s.jsx)(o,{query:j,onChange:v})}),(0,s.jsxs)("div",{className:"d-flex flex-column flex-md-row align-items-stretch w-100 w-md-auto",style:{gap:"10px"},children:[a.length>0&&(0,s.jsx)(y,{topics:a,selectedTopics:b,onTopicsChange:I}),(0,s.jsx)(O,{onRangeChange:M}),(0,s.jsx)(C,{sortOrder:f,onChange:L})]})]}),T.length>0?T.map(e=>(0,s.jsx)(k,{post:e},e.id)):(0,s.jsxs)(c.Z,{variant:"warning",className:"mb-0 d-flex align-items-center justify-content-center py-3",children:[(0,s.jsx)(i.G,{icon:"exclamation-circle",className:"me-2",size:"lg"}),null!=d?d:m("post.noPostsFound")]}),P.length>0&&(0,s.jsx)(p,{currentPage:x,totalPages:Math.ceil(P.length/h),size:h,onPageChange:g,onSizeChange:G,totalResults:P.length})]})}a(58837)}}]);