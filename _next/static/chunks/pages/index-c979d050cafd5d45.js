(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[405],{8312:(e,t,a)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/",function(){return a(7770)}])},3280:(e,t,a)=>{"use strict";a.d(t,{Z:()=>i});var s=a(3967),l=a.n(s),r=a(7294),n=a(7400),c=a(5893);let o=r.forwardRef((e,t)=>{let{bsPrefix:a,bg:s="primary",pill:r=!1,text:o,className:i,as:d="span",...m}=e,u=(0,n.vE)(a,"badge");return(0,c.jsx)(d,{ref:t,...m,className:l()(i,u,r&&"rounded-pill",o&&"text-".concat(o),s&&"bg-".concat(s))})});o.displayName="Badge";let i=o},7770:(e,t,a)=>{"use strict";a.r(t),a.d(t,{__N_SSG:()=>ec,default:()=>eo});var s=a(5893),l=a(7294),r=a(7375),n=a(3967),c=a.n(n),o=a(7400);let i=l.createContext({}),d=l.forwardRef((e,t)=>{let{id:a,bsPrefix:r,className:n,type:d="checkbox",isValid:m=!1,isInvalid:u=!1,as:p="input",...x}=e,{controlId:h}=(0,l.useContext)(i);return r=(0,o.vE)(r,"form-check-input"),(0,s.jsx)(p,{...x,ref:t,type:d,id:a||h,className:c()(n,r,m&&"is-valid",u&&"is-invalid")})});d.displayName="FormCheckInput";let m=l.createContext(null);m.displayName="InputGroupContext";let u=l.forwardRef((e,t)=>{let{className:a,bsPrefix:l,as:r="span",...n}=e;return l=(0,o.vE)(l,"input-group-text"),(0,s.jsx)(r,{ref:t,className:c()(a,l),...n})});u.displayName="InputGroupText";let p=l.forwardRef((e,t)=>{let{bsPrefix:a,size:r,hasValidation:n,className:i,as:d="div",...u}=e;a=(0,o.vE)(a,"input-group");let p=(0,l.useMemo)(()=>({}),[]);return(0,s.jsx)(m.Provider,{value:p,children:(0,s.jsx)(d,{ref:t,...u,className:c()(i,a,r&&"".concat(a,"-").concat(r),n&&"has-validation")})})});p.displayName="InputGroup";let x=Object.assign(p,{Text:u,Radio:e=>(0,s.jsx)(u,{children:(0,s.jsx)(d,{type:"radio",...e})}),Checkbox:e=>(0,s.jsx)(u,{children:(0,s.jsx)(d,{type:"checkbox",...e})})});var h=a(5697),f=a.n(h);let j={type:f().string,tooltip:f().bool,as:f().elementType},N=l.forwardRef((e,t)=>{let{as:a="div",className:l,type:r="valid",tooltip:n=!1,...o}=e;return(0,s.jsx)(a,{...o,ref:t,className:c()(l,"".concat(r,"-").concat(n?"tooltip":"feedback"))})});N.displayName="Feedback",N.propTypes=j;let v=l.forwardRef((e,t)=>{let{bsPrefix:a,className:r,htmlFor:n,...d}=e,{controlId:m}=(0,l.useContext)(i);return a=(0,o.vE)(a,"form-check-label"),(0,s.jsx)("label",{...d,ref:t,htmlFor:n||m,className:c()(r,a)})});v.displayName="FormCheckLabel";let g=l.forwardRef((e,t)=>{let{id:a,bsPrefix:r,bsSwitchPrefix:n,inline:m=!1,reverse:u=!1,disabled:p=!1,isValid:x=!1,isInvalid:h=!1,feedbackTooltip:f=!1,feedback:j,feedbackType:g,className:y,style:b,title:w="",type:C="checkbox",label:E,children:k,as:F="input",...R}=e;r=(0,o.vE)(r,"form-check"),n=(0,o.vE)(n,"form-switch");let{controlId:P}=(0,l.useContext)(i),L=(0,l.useMemo)(()=>({controlId:a||P}),[P,a]),I=!k&&null!=E&&!1!==E||l.Children.toArray(k).some(e=>l.isValidElement(e)&&e.type===v),_=(0,s.jsx)(d,{...R,type:"switch"===C?"checkbox":C,ref:t,isValid:x,isInvalid:h,disabled:p,as:F});return(0,s.jsx)(i.Provider,{value:L,children:(0,s.jsx)("div",{style:b,className:c()(y,I&&r,m&&"".concat(r,"-inline"),u&&"".concat(r,"-reverse"),"switch"===C&&n),children:k||(0,s.jsxs)(s.Fragment,{children:[_,I&&(0,s.jsx)(v,{title:w,children:E}),j&&(0,s.jsx)(N,{type:g,tooltip:f,children:j})]})})})});g.displayName="FormCheck";let y=Object.assign(g,{Input:d,Label:v});a(2473);let b=l.forwardRef((e,t)=>{let{bsPrefix:a,type:r,size:n,htmlSize:d,id:m,className:u,isValid:p=!1,isInvalid:x=!1,plaintext:h,readOnly:f,as:j="input",...N}=e,{controlId:v}=(0,l.useContext)(i);return a=(0,o.vE)(a,"form-control"),(0,s.jsx)(j,{...N,type:r,size:d,ref:t,readOnly:f,id:m||v,className:c()(u,h?"".concat(a,"-plaintext"):a,n&&"".concat(a,"-").concat(n),"color"===r&&"".concat(a,"-color"),p&&"is-valid",x&&"is-invalid")})});b.displayName="FormControl";let w=Object.assign(b,{Feedback:N}),C=l.forwardRef((e,t)=>{let{className:a,bsPrefix:l,as:r="div",...n}=e;return l=(0,o.vE)(l,"form-floating"),(0,s.jsx)(r,{ref:t,className:c()(a,l),...n})});C.displayName="FormFloating";let E=l.forwardRef((e,t)=>{let{controlId:a,as:r="div",...n}=e,c=(0,l.useMemo)(()=>({controlId:a}),[a]);return(0,s.jsx)(i.Provider,{value:c,children:(0,s.jsx)(r,{...n,ref:t})})});E.displayName="FormGroup";let k=l.forwardRef((e,t)=>{let[{className:a,...l},{as:r="div",bsPrefix:n,spans:i}]=function(e){let{as:t,bsPrefix:a,className:s,...l}=e;a=(0,o.vE)(a,"col");let r=(0,o.pi)(),n=(0,o.zG)(),i=[],d=[];return r.forEach(e=>{let t,s,r;let c=l[e];delete l[e],"object"==typeof c&&null!=c?{span:t,offset:s,order:r}=c:t=c;let o=e!==n?"-".concat(e):"";t&&i.push(!0===t?"".concat(a).concat(o):"".concat(a).concat(o,"-").concat(t)),null!=r&&d.push("order".concat(o,"-").concat(r)),null!=s&&d.push("offset".concat(o,"-").concat(s))}),[{...l,className:c()(s,...i,...d)},{as:t,bsPrefix:a,spans:i}]}(e);return(0,s.jsx)(r,{...l,ref:t,className:c()(a,!i.length&&n)})});k.displayName="Col";let F=l.forwardRef((e,t)=>{let{as:a="label",bsPrefix:r,column:n=!1,visuallyHidden:d=!1,className:m,htmlFor:u,...p}=e,{controlId:x}=(0,l.useContext)(i);r=(0,o.vE)(r,"form-label");let h="col-form-label";"string"==typeof n&&(h="".concat(h," ").concat(h,"-").concat(n));let f=c()(m,r,d&&"visually-hidden",n&&h);return(u=u||x,n)?(0,s.jsx)(k,{ref:t,as:"label",className:f,htmlFor:u,...p}):(0,s.jsx)(a,{ref:t,className:f,htmlFor:u,...p})});F.displayName="FormLabel";let R=l.forwardRef((e,t)=>{let{bsPrefix:a,className:r,id:n,...d}=e,{controlId:m}=(0,l.useContext)(i);return a=(0,o.vE)(a,"form-range"),(0,s.jsx)("input",{...d,type:"range",ref:t,className:c()(r,a),id:n||m})});R.displayName="FormRange";let P=l.forwardRef((e,t)=>{let{bsPrefix:a,size:r,htmlSize:n,className:d,isValid:m=!1,isInvalid:u=!1,id:p,...x}=e,{controlId:h}=(0,l.useContext)(i);return a=(0,o.vE)(a,"form-select"),(0,s.jsx)("select",{...x,size:n,ref:t,className:c()(d,a,r&&"".concat(a,"-").concat(r),m&&"is-valid",u&&"is-invalid"),id:p||h})});P.displayName="FormSelect";let L=l.forwardRef((e,t)=>{let{bsPrefix:a,className:l,as:r="small",muted:n,...i}=e;return a=(0,o.vE)(a,"form-text"),(0,s.jsx)(r,{...i,ref:t,className:c()(l,a,n&&"text-muted")})});L.displayName="FormText";let I=l.forwardRef((e,t)=>(0,s.jsx)(y,{...e,ref:t,type:"switch"}));I.displayName="Switch";let _=Object.assign(I,{Input:y.Input,Label:y.Label}),S=l.forwardRef((e,t)=>{let{bsPrefix:a,className:l,children:r,controlId:n,label:i,...d}=e;return a=(0,o.vE)(a,"form-floating"),(0,s.jsxs)(E,{ref:t,className:c()(l,a),controlId:n,...d,children:[r,(0,s.jsx)("label",{htmlFor:n,children:i})]})});S.displayName="FloatingLabel";let T={_ref:f().any,validated:f().bool,as:f().elementType},M=l.forwardRef((e,t)=>{let{className:a,validated:l,as:r="form",...n}=e;return(0,s.jsx)(r,{...n,ref:t,className:c()(a,l&&"was-validated")})});M.displayName="Form",M.propTypes=T;let G=Object.assign(M,{Group:E,Control:w,Floating:C,Check:y,Switch:_,Label:F,Text:L,Range:R,Select:P,FloatingLabel:S});var O=a(7814);function z(e){let{query:t,onChange:a}=e;return(0,s.jsxs)(x,{className:"mb-4",children:[(0,s.jsx)(x.Text,{className:"icon",children:(0,s.jsx)(O.G,{icon:"search"})}),(0,s.jsx)(G.Control,{type:"text",placeholder:"Search posts...",value:t,onChange:e=>{a(e.target.value)}})]})}let Z=l.forwardRef((e,t)=>{let{bsPrefix:a,className:l,as:r="div",...n}=e,i=(0,o.vE)(a,"row"),d=(0,o.pi)(),m=(0,o.zG)(),u="".concat(i,"-cols"),p=[];return d.forEach(e=>{let t;let a=n[e];delete n[e],null!=a&&"object"==typeof a?{cols:t}=a:t=a,null!=t&&p.push("".concat(u).concat(e!==m?"-".concat(e):"","-").concat(t))}),(0,s.jsx)(r,{ref:t,...n,className:c()(l,i,...p)})});Z.displayName="Row";var B=a(6493);let D=l.forwardRef((e,t)=>{let{active:a=!1,disabled:l=!1,className:r,style:n,activeLabel:o="(current)",children:i,linkStyle:d,linkClassName:m,as:u=B.Z,...p}=e,x=a||l?"span":u;return(0,s.jsx)("li",{ref:t,style:n,className:c()(r,"page-item",{active:a,disabled:l}),children:(0,s.jsxs)(x,{className:c()("page-link",m),style:d,...p,children:[i,a&&o&&(0,s.jsx)("span",{className:"visually-hidden",children:o})]})})});function W(e,t){let a=arguments.length>2&&void 0!==arguments[2]?arguments[2]:e,r=l.forwardRef((e,l)=>{let{children:r,...n}=e;return(0,s.jsxs)(D,{...n,ref:l,children:[(0,s.jsx)("span",{"aria-hidden":"true",children:r||t}),(0,s.jsx)("span",{className:"visually-hidden",children:a})]})});return r.displayName=e,r}D.displayName="PageItem";let V=W("First","\xab"),X=W("Prev","‹","Previous"),q=W("Ellipsis","…","More"),A=W("Next","›"),H=W("Last","\xbb"),J=l.forwardRef((e,t)=>{let{bsPrefix:a,className:l,size:r,...n}=e,i=(0,o.vE)(a,"pagination");return(0,s.jsx)("ul",{ref:t,...n,className:c()(l,i,r&&"".concat(i,"-").concat(r))})});J.displayName="Pagination";let K=Object.assign(J,{First:V,Prev:X,Ellipsis:q,Item:D,Next:A,Last:H}),Q=e=>{let{currentPage:t,totalPages:a,maxPagesToShow:l=5,onPageChange:r}=e,n=[],c=Math.max(1,Math.min(t-Math.floor(l/2),a-l+1)),o=Math.min(a,c+l-1);n.push((0,s.jsx)(K.First,{disabled:1===t,onClick:()=>r(1)},"first"),(0,s.jsx)(K.Prev,{disabled:1===t,onClick:()=>r(t-1)},"prev")),c>1&&(n.push((0,s.jsx)(K.Item,{onClick:()=>r(1),children:"1"},1)),c>2&&n.push((0,s.jsx)(K.Ellipsis,{disabled:!0},"start-ellipsis")));for(let e=c;e<=o;e++)n.push((0,s.jsx)(K.Item,{active:e===t,onClick:()=>r(e),children:e},e));return o<a&&(o<a-1&&n.push((0,s.jsx)(K.Ellipsis,{disabled:!0},"end-ellipsis")),n.push((0,s.jsx)(K.Item,{onClick:()=>r(a),children:a},a))),n.push((0,s.jsx)(K.Next,{disabled:t===a,onClick:()=>r(t+1)},"next"),(0,s.jsx)(K.Last,{disabled:t===a,onClick:()=>r(a)},"last")),(0,s.jsx)(K,{children:n})};function U(e){let{currentPage:t,totalPages:a,maxPagesToShow:l=5,size:r,onPageChange:n,onSizeChange:c}=e;return(0,s.jsxs)(Z,{className:"align-items-center mt-4",children:[(0,s.jsx)(k,{children:(0,s.jsx)(Q,{currentPage:t,totalPages:a,onPageChange:n,maxPagesToShow:l})}),(0,s.jsx)(k,{md:"auto",children:(0,s.jsxs)(G.Group,{controlId:"postsPerPageSelect",className:"d-flex align-items-center",children:[(0,s.jsx)(G.Label,{className:"me-2 mb-0",children:"Page size:"}),(0,s.jsxs)(G.Select,{value:r,onChange:e=>c(Number(e.target.value)),style:{width:"100px"},children:[(0,s.jsx)("option",{value:5,children:"5"}),(0,s.jsx)("option",{value:10,children:"10"}),(0,s.jsx)("option",{value:20,children:"20"})]})]})})]})}var Y=a(1664),$=a.n(Y),ee=a(5675),et=a.n(ee),ea=a(3280);function es(e){let{post:t}=e,{id:a,title:l,date:r,summary:n,thumbnail:c,topics:o}=t;return(0,s.jsxs)("div",{className:"post-card d-flex align-items-center mb-4",children:[(0,s.jsxs)("div",{className:"post-card-content flex-grow-1",children:[(0,s.jsx)("h2",{className:"fw-bold mb-2",children:(0,s.jsx)($(),{href:"/posts/".concat(a),className:"link",children:l})}),(0,s.jsx)("p",{className:"text-muted mb-2",children:n}),(0,s.jsx)("p",{className:"text-muted",children:new Date(r).toLocaleDateString(void 0,{year:"numeric",month:"long",day:"numeric"})}),o&&o.length>0&&(0,s.jsx)("div",{className:"mt-2",children:o.map(e=>(0,s.jsx)(ea.Z,{bg:"secondary",className:"me-2",children:e},e))})]}),c&&(0,s.jsx)("div",{className:"post-card-thumbnail-wrapper ms-3",children:(0,s.jsx)(et(),{src:"".concat("/blog/").concat(c),alt:l,className:"rounded",width:120,height:80,style:{objectFit:"cover"}})})]})}function el(e){let{posts:t}=e,[a,n]=(0,l.useState)(5),[c,o]=(0,l.useState)(1),[i,d]=(0,l.useState)(""),m=t.filter(e=>e.title.toLowerCase().includes(i.toLowerCase())||e.summary.toLowerCase().includes(i.toLowerCase())),u=Math.ceil(m.length/a),p=m.slice((c-1)*a,c*a);return(0,s.jsxs)(r.Z,{className:"mt-5",style:{maxWidth:"700px"},children:[(0,s.jsx)(z,{query:i,onChange:e=>{d(e),o(1)}}),p.length>0?p.map(e=>(0,s.jsx)(es,{post:e},e.id)):(0,s.jsx)("p",{className:"text-center text-muted",children:"No posts found."}),m.length>0&&(0,s.jsx)(U,{currentPage:c,totalPages:u,size:a,onPageChange:e=>o(e),onSizeChange:e=>{n(e),o(1)}})]})}var er=a(9008),en=a.n(er),ec=!0;function eo(e){let{allPostsData:t}=e;return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(en(),{children:[(0,s.jsx)("title",{children:"Welcome to My Blog"}),(0,s.jsx)("meta",{name:"description",content:"Explore the latest articles, tutorials, and insights on my blog. Discover a variety of topics including programming, technology, and more."}),(0,s.jsx)("meta",{name:"keywords",content:"blog, articles, tutorials, programming, technology"}),(0,s.jsx)("meta",{name:"author",content:"Şuayb Şimşek"})]}),(0,s.jsxs)("div",{children:[(0,s.jsxs)("header",{className:"text-center py-5",children:[(0,s.jsx)("h1",{className:"fw-bold mb-4",children:"Welcome to My Blog"}),(0,s.jsx)("p",{className:"text-muted fs-5",children:"Explore the latest articles, tutorials, and insights."})]}),(0,s.jsx)(el,{posts:t})]})]})}},9008:(e,t,a)=>{e.exports=a(3867)},2473:e=>{"use strict";e.exports=function(){}}},e=>{var t=t=>e(e.s=t);e.O(0,[888,774,179],()=>t(8312)),_N_E=e.O()}]);