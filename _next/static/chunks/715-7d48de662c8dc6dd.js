"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[715],{97143:(e,s,a)=>{a.d(s,{Z:()=>i});var t=a(85893);a(67294);var l=a(11163),c=a(34421),n=a.n(c);function i(e){var s;let{date:a,locale:c}=e,i=(0,l.useRouter)(),r=null!==(s=null!=c?c:i.query.locale)&&void 0!==s?s:n().i18n.defaultLocale;return(0,t.jsx)("span",{children:new Date(a).toLocaleDateString(r,{year:"numeric",month:"long",day:"numeric"})})}},92285:(e,s,a)=>{a.d(s,{Z:()=>n});var t=a(85893),l=a(25675),c=a.n(l);function n(e){let{src:s,alt:a,width:l=800,height:n=600,className:i="",priority:r=!0}=e;return(0,t.jsx)("div",{className:"image-wrapper text-center mb-4 ".concat(i),children:(0,t.jsx)(c(),{src:s,alt:a,className:"img-fluid rounded",width:l,height:n,style:{width:"100%",height:"auto"},priority:r})})}},88715:(e,s,a)=>{a.d(s,{Z:()=>S});var t=a(85893),l=a(67294),c=a(97375),n=a(70525),i=a(67814),r=a(48352);function o(e){let{query:s,onChange:a,className:c}=e,{t:n}=(0,r.$G)("common"),o=(0,l.useCallback)(e=>{a(e.target.value)},[a]),m=(0,l.useCallback)(()=>{a("")},[a]);return(0,t.jsxs)("div",{className:"search-bar d-flex align-items-center ".concat(null!=c?c:""),children:[(0,t.jsx)("div",{className:"search-icon",children:(0,t.jsx)(i.G,{icon:"search"})}),(0,t.jsx)("input",{type:"text",className:"search-input form-control",placeholder:n("common.searchBar.placeholder"),value:s,onChange:o}),s&&(0,t.jsx)("button",{className:"border-0 bg-transparent",onClick:m,children:(0,t.jsx)(i.G,{icon:"times-circle",className:"clear-icon"})})]})}var m=a(19101),d=a(68070),h=a(23933);let x=e=>{let{currentPage:s,totalPages:a,maxPagesToShow:l=5,onPageChange:c,className:n=""}=e,i=[],r=Math.max(1,Math.min(s-Math.floor(l/2),a-l+1)),o=Math.min(a,r+l-1);i.push((0,t.jsx)(h.Z.First,{disabled:1===s,onClick:()=>c(1)},"first"),(0,t.jsx)(h.Z.Prev,{disabled:1===s,onClick:()=>c(s-1)},"prev")),r>1&&(i.push((0,t.jsx)(h.Z.Item,{onClick:()=>c(1),children:"1"},1)),r>2&&i.push((0,t.jsx)(h.Z.Ellipsis,{disabled:!0},"start-ellipsis")));for(let e=r;e<=o;e++)i.push((0,t.jsx)(h.Z.Item,{active:e===s,onClick:()=>c(e),children:e},e));return o<a&&(o<a-1&&i.push((0,t.jsx)(h.Z.Ellipsis,{disabled:!0},"end-ellipsis")),i.push((0,t.jsx)(h.Z.Item,{onClick:()=>c(a),children:a},a))),i.push((0,t.jsx)(h.Z.Next,{disabled:s===a,onClick:()=>c(s+1)},"next"),(0,t.jsx)(h.Z.Last,{disabled:s===a,onClick:()=>c(a)},"last")),(0,t.jsx)(h.Z,{className:n,children:i})};var u=a(21351);let j=e=>{let{size:s=5,pageSizeOptions:a=[5,10,20],onSizeChange:l,className:c=""}=e;return(0,t.jsxs)("fieldset",{className:"d-flex align-items-center ".concat(c),children:[(0,t.jsx)("legend",{className:"visually-hidden",children:"Page size selector"}),(0,t.jsx)(u.Z.Label,{htmlFor:"postsPerPageSelect",className:"me-2 mb-0",children:"Page size:"}),(0,t.jsx)(u.Z.Select,{id:"postsPerPageSelect",className:"mb-0",value:s,onChange:e=>l(Number(e.target.value)),style:{width:"100px"},children:a.map(e=>(0,t.jsx)("option",{value:e,children:e},e))})]})};function p(e){let{currentPage:s,totalPages:a,totalResults:l,size:n,pageSizeOptions:i=[5,10,20],maxPagesToShow:o=5,onPageChange:h,onSizeChange:u}=e,{t:p}=(0,r.$G)("common"),g=Math.min(s*n,l);return(0,t.jsx)(c.Z,{className:"pagination-bar",children:(0,t.jsxs)(m.Z,{className:"align-items-center justify-content-between flex-wrap gy-3",children:[(0,t.jsx)(d.Z,{xs:12,md:"auto",className:"d-flex justify-content-center flex-wrap",children:(0,t.jsx)(x,{className:"pagination mb-0",currentPage:s,totalPages:a,onPageChange:h,maxPagesToShow:o})}),(0,t.jsx)(d.Z,{xs:12,md:!0,className:"d-flex align-items-center justify-content-center justify-content-md-start",children:(0,t.jsx)("p",{className:"text-muted mb-0 text-nowrap",children:p("common.pagination.showingResults",{start:(s-1)*n+1,end:g,total:l})})}),(0,t.jsx)(d.Z,{xs:12,md:"auto",className:"d-flex align-items-center justify-content-center justify-content-md-end",children:(0,t.jsx)(j,{size:n,pageSizeOptions:i,onSizeChange:u})})]})})}var g=a(27749),f=a(53280),N=a(76720),b=a(97143),v=a(70270),Z=a(92285);function w(e){let{post:s}=e,{id:a,title:l,date:c,summary:n,thumbnail:i,topics:o}=s,{t:m}=(0,r.$G)("post");return(0,t.jsx)("div",{className:"post-card d-flex align-items-center mb-4",children:(0,t.jsxs)("div",{className:"post-card-content flex-grow-1",children:[(0,t.jsx)("h2",{className:"fw-bold mb-4",children:(0,t.jsx)(g.Z,{href:"/posts/".concat(a),className:"link",children:l})}),(0,t.jsx)("p",{className:"text-muted",children:(0,t.jsx)(g.Z,{href:"/posts/".concat(a),children:(0,t.jsx)(b.Z,{date:c})})}),o&&o.length>0&&(0,t.jsx)("div",{className:"mb-4",children:o.map(e=>(0,t.jsx)(g.Z,{href:"/topics/".concat(e.id),children:(0,t.jsx)(f.Z,{bg:e.color,className:"me-2 badge-".concat(e.color),children:e.name})},e.id))}),i&&(0,t.jsx)(g.Z,{href:"/posts/".concat(a),children:(0,t.jsx)(Z.Z,{className:"thumbnail-wrapper",src:"".concat(v.Vc).concat(i),alt:l,width:800,height:600})}),(0,t.jsx)("p",{className:"mb-4",children:n}),(0,t.jsx)("div",{className:"mb-4",children:(0,t.jsx)(g.Z,{href:"/posts/".concat(a),children:(0,t.jsx)(N.Z,{className:"primary",children:m("post.readMore")})})})]})})}var C=a(85742),k=a(41874);function y(e){let{sortOrder:s,onChange:a}=e,{t:l}=(0,r.$G)("common");return(0,t.jsxs)(C.Z,{id:"sort-dropdown",variant:"primary",className:"me-2 mb-2",align:"start",flip:!1,title:l("asc"===s?"common.sort.oldest":"common.sort.newest"),onSelect:e=>e&&a(e),children:[(0,t.jsxs)(k.Z.Item,{eventKey:"desc",children:[l("common.sort.newest"),"desc"===s&&(0,t.jsx)(i.G,{icon:"circle-check",className:"ms-2 circle-check"})]}),(0,t.jsxs)(k.Z.Item,{eventKey:"asc",children:[l("common.sort.oldest"),"asc"===s&&(0,t.jsx)(i.G,{icon:"circle-check",className:"ms-2 circle-check"})]})]})}function P(e){let{topics:s,selectedTopics:a,onTopicsChange:c}=e,{t:m}=(0,r.$G)(["common","topic"]),[d,h]=(0,l.useState)(""),[u,j]=(0,l.useState)(1),p=(0,l.useMemo)(()=>s.filter(e=>e.name.toLowerCase().includes(d.toLowerCase().trim())),[s,d]),g=(0,l.useMemo)(()=>p.slice((u-1)*5,5*u),[p,u,5]),b=(0,l.useMemo)(()=>{if(0===a.length)return m("topic:topic.allTopics");if(a.length>3){let e=a.slice(0,3).map(e=>{var a;return null===(a=s.find(s=>s.id===e))||void 0===a?void 0:a.name}).filter(Boolean).join(", ");return"".concat(e," ").concat(m("common.andMore",{count:a.length-3}))}return a.map(e=>{var a;return null===(a=s.find(s=>s.id===e))||void 0===a?void 0:a.name}).filter(Boolean).join(", ")},[a,s,m]),v=(0,l.useCallback)(e=>{h(e),j(1)},[]),Z=(0,l.useCallback)(e=>{j(e)},[]),w=(0,l.useCallback)(e=>{c(a.includes(e)?a.filter(s=>s!==e):[...a,e]),h(""),j(1)},[a,c]),y=(0,l.useCallback)(e=>{c(a.filter(s=>s!==e))},[a,c]);return(0,t.jsxs)(C.Z,{id:"topics-dropdown",variant:"primary",className:"mb-2 topics-dropdown",flip:!1,align:"start",title:b,autoClose:"outside",children:[(0,t.jsx)("div",{className:"p-2",children:(0,t.jsx)(o,{query:d,onChange:v,className:"w-100"})}),(0,t.jsx)(k.Z.Divider,{}),a.length>0&&(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(k.Z.Header,{children:(0,t.jsxs)("div",{className:"d-flex justify-content-between align-items-center",children:[(0,t.jsx)("span",{children:m("topic:topic.selectedTopics")}),(0,t.jsxs)(N.Z,{variant:"danger",onClick:()=>c([]),className:"btn-badge",children:[(0,t.jsx)(i.G,{icon:"trash",className:"me-1"}),m("common.clearAll")]})]})}),(0,t.jsx)("div",{className:"p-2 ms-2",children:a.map(e=>{let a=s.find(s=>s.id===e);return a?(0,t.jsxs)(f.Z,{bg:a.color,className:"badge-".concat(a.color," me-2 mb-2"),children:[a.name," ",(0,t.jsx)(i.G,{icon:"times",className:"ms-1 cursor-pointer",onClick:()=>y(e)})]},e):null})}),(0,t.jsx)(k.Z.Divider,{})]}),(0,t.jsxs)(k.Z.Item,{onClick:()=>c([]),className:"d-flex align-items-center",children:[(0,t.jsx)(f.Z,{bg:"gray",className:"badge-gray me-2",children:m("topic:topic.allTopics")}),0===a.length&&(0,t.jsx)(i.G,{icon:"circle-check",className:"ms-auto"})]}),g.length>0?g.map(e=>(0,t.jsxs)(k.Z.Item,{onClick:()=>w(e.id),className:"d-flex align-items-center",children:[(0,t.jsx)(f.Z,{bg:e.color,className:"badge-".concat(e.color," me-2"),children:e.name}),a.includes(e.id)&&(0,t.jsx)(i.G,{icon:"circle-check",className:"ms-auto"})]},e.id)):(0,t.jsx)(k.Z.Item,{className:"text-center py-3",children:(0,t.jsxs)(n.Z,{variant:"warning",className:"mb-0 d-flex align-items-center",children:[(0,t.jsx)(i.G,{icon:"exclamation-circle",className:"me-2",size:"lg"}),m("topic:topic.noTopicFound")]})}),p.length>0&&(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(k.Z.Divider,{}),(0,t.jsx)("div",{className:"d-flex justify-content-center p-2",children:(0,t.jsx)(x,{currentPage:u,totalPages:Math.ceil(p.length/5),maxPagesToShow:5,onPageChange:Z})})]})]})}function S(e){let{posts:s,topics:a=[],noPostsFoundMessage:m}=e,{t:d}=(0,r.$G)(["post","common"]),[h,x]=(0,l.useState)(5),[u,j]=(0,l.useState)(1),[g,f]=(0,l.useState)(""),[N,b]=(0,l.useState)("desc"),[v,Z]=(0,l.useState)([]),C=(0,l.useMemo)(()=>s.filter(e=>{var s;return(e.title.toLowerCase().includes(g.toLowerCase())||e.summary.toLowerCase().includes(g.toLowerCase()))&&(0===v.length||(null===(s=e.topics)||void 0===s?void 0:s.some(e=>v.includes(e.id))))}),[s,g,v]),k=(0,l.useMemo)(()=>[...C].sort((e,s)=>"asc"===N?new Date(e.date).getTime()-new Date(s.date).getTime():new Date(s.date).getTime()-new Date(e.date).getTime()),[C,N]),S=(0,l.useMemo)(()=>k.slice((u-1)*h,u*h),[k,u,h]),G=(0,l.useCallback)(e=>{b(e),j(1)},[]),M=(0,l.useCallback)(e=>{Z(e),j(1)},[]),T=(0,l.useCallback)(e=>{x(e),j(1)},[]);return(0,t.jsxs)(c.Z,{className:"mt-5",style:{maxWidth:"800px"},children:[(0,t.jsxs)("div",{className:"d-flex flex-wrap align-items-center mb-3",children:[(0,t.jsx)("div",{className:"flex-grow-1 mb-4",children:(0,t.jsx)(o,{query:g,onChange:f})}),(0,t.jsxs)("div",{className:"d-flex flex-column flex-md-row align-items-stretch w-100 w-md-auto",style:{gap:"10px"},children:[a.length>0&&(0,t.jsx)(P,{topics:a,selectedTopics:v,onTopicsChange:M}),(0,t.jsx)(y,{sortOrder:N,onChange:G})]})]}),S.length>0?S.map(e=>(0,t.jsx)(w,{post:e},e.id)):(0,t.jsxs)(n.Z,{variant:"warning",className:"mb-0 d-flex align-items-center justify-content-center py-3",children:[(0,t.jsx)(i.G,{icon:"exclamation-circle",className:"me-2",size:"lg"}),null!=m?m:d("post.noPostsFound")]}),k.length>0&&(0,t.jsx)(p,{currentPage:u,totalPages:Math.ceil(k.length/h),size:h,onPageChange:j,onSizeChange:T,totalResults:k.length})]})}}}]);