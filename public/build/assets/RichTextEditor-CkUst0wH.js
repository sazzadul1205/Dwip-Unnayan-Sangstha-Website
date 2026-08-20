import{r as l,j as e,b as re}from"./app-DrTgUkPP.js";import{bc as le,bd as oe,be as ne,b7 as se,a7 as P,bf as ae,bg as ie}from"./index-B3nNzE1w.js";import{S as j}from"./sweetalert2.esm.all-0Z_61IYw.js";const u={paragraph:"font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4",headings:{1:"font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4",2:"font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4",3:"font-700 text-xl sm:text-2xl lg:text-3xl text-[#080C14] mt-8 mb-4",4:"font-700 text-lg sm:text-xl lg:text-2xl text-[#080C14] mt-6 mb-3",5:"font-700 text-base sm:text-lg lg:text-xl text-[#080C14] mt-6 mb-3",6:"font-700 text-sm sm:text-base lg:text-lg text-[#080C14] mt-4 mb-2",7:"font-700 text-sm sm:text-base lg:text-base text-[#080C14] mt-4 mb-2"},unorderedList:"list-disc pl-6 space-y-3 mb-6",orderedList:"list-decimal pl-6 space-y-3 mb-6",listItem:"font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed",image:"rounded-lg max-w-full h-auto"},ue=({value:v="",onChange:c,height:k="400px",className:O="",placeholder:S="Write something...",onImageUploaded:B})=>{const a=l.useRef(null),g=l.useRef(!1),w=l.useRef(null),N=l.useRef(!1),C=l.useRef(null),E=l.useRef(null),[W,q]=l.useState({bold:!1,italic:!1,underline:!1,insertUnorderedList:!1,insertOrderedList:!1}),[H,F]=l.useState(!1),[G,V]=l.useState("#333333"),[M,T]=l.useState(!1),[$,R]=l.useState(!1),[s,h]=l.useState({url:"",width:400,alignment:"center",alt:""}),[J,L]=l.useState(!1),z="p-1.5 rounded transition flex items-center justify-center text-gray-700 min-w-[36px]",Y="bg-blue-600 text-white",_="hover:bg-gray-200",D=l.useCallback(()=>{const t=window.getSelection();if(t&&t.rangeCount>0)try{w.current=t.getRangeAt(0).cloneRange()}catch(r){console.error("Error saving selection:",r)}},[]),f=l.useCallback(()=>{const t=window.getSelection();if(t&&w.current)try{t.removeAllRanges(),t.addRange(w.current)}catch(r){console.error("Error restoring selection:",r)}},[]),d=l.useCallback(()=>{try{q({bold:document.queryCommandState("bold"),italic:document.queryCommandState("italic"),underline:document.queryCommandState("underline"),insertUnorderedList:document.queryCommandState("insertUnorderedList"),insertOrderedList:document.queryCommandState("insertOrderedList")})}catch(t){console.error("Error updating active formats:",t)}},[]),K=l.useCallback(()=>{const t=a.current;t&&(clearTimeout(C.current),C.current=setTimeout(()=>{const r=t.innerHTML;g.current=!0,c(r)},100))},[c]),p=l.useCallback((t,r=null)=>{const n=a.current;if(!n)return;n.focus(),f(),document.execCommand(t,!1,r);const o=n.innerHTML;g.current=!0,c(o),d()},[c,f,d]),Q=l.useCallback(t=>{const r=a.current;if(!r)return;r.focus(),f();const o=window.getSelection().toString()||" ";if(t==="normal"){const i=`<p class="${u.paragraph}">${o}</p>`;document.execCommand("insertHTML",!1,i)}else{const i=u.headings[t]||u.headings[1],x=`<h${t} class="${i}">${o}</h${t}>`;document.execCommand("insertHTML",!1,x)}const m=r.innerHTML;g.current=!0,c(m),d()},[c,f,d]),U=l.useCallback(t=>{const r=a.current;if(!r)return;r.focus(),f();const n=t==="ul"?"insertUnorderedList":"insertOrderedList";document.execCommand(n,!1,null);let o=r.innerHTML;t==="ul"?(o=o.replace(/<ul>/g,`<ul class="${u.unorderedList}">`),o=o.replace(/<li>/g,`<li class="${u.listItem}">`)):(o=o.replace(/<ol>/g,`<ol class="${u.orderedList}">`),o=o.replace(/<li>/g,`<li class="${u.listItem}">`)),r.innerHTML=o,g.current=!0,c(o),d()},[c,f,d]),A=l.useCallback(t=>{V(t),p("foreColor",t),F(!1)},[p]),X=()=>{var t;(t=E.current)==null||t.click()},Z=async t=>{const r=t.target.files[0];if(r){if(!r.type.startsWith("image/")){j.fire({icon:"error",title:"Invalid File",text:"Please select an image file.",confirmButtonColor:"#3b82f6"});return}if(r.size>5*1024*1024){j.fire({icon:"error",title:"File Too Large",text:"Image size should be less than 5MB.",confirmButtonColor:"#3b82f6"});return}R(!0),T(!1);try{const n=new FileReader,o=await new Promise((x,y)=>{n.onload=I=>x(I.target.result),n.onerror=y,n.readAsDataURL(r)}),i=(await re.post(route("admin.upload-editor-image"),{image:o},{headers:{"Content-Type":"application/json"}})).data.url;B&&B(i),h({url:i,width:400,alignment:"center",alt:r.name.split(".")[0]||"Image"}),L(!0)}catch(n){console.error("Upload error:",n),j.fire({icon:"error",title:"Upload Failed",text:"Could not upload image. Please try again.",confirmButtonColor:"#3b82f6"})}finally{R(!1),t.target.value=""}}},ee=()=>{const{url:t,width:r,alignment:n,alt:o}=s;if(!t){j.fire({icon:"warning",title:"No Image",text:"Please upload an image first.",confirmButtonColor:"#3b82f6"});return}const m=a.current;if(!m)return;m.focus(),f();let i="";n==="left"?i="float-left mr-4":n==="right"&&(i="float-right ml-4");const x=`<img src="${t}" alt="${o||"Image"}" style="width: ${r}px; max-width: 100%; height: auto;" class="${u.image} ${i}" />`;let y=x;n==="center"?y=`<div style="text-align: center; margin: 1rem 0;">${x}</div>`:y=`<div style="margin: 1rem 0;" class="clearfix">${x}</div>`,document.execCommand("insertHTML",!1,y);const I=m.innerHTML;g.current=!0,c(I),L(!1),h({url:"",width:400,alignment:"center",alt:""})};l.useEffect(()=>{a.current&&!N.current&&(a.current.innerHTML=v||"",N.current=!0)},[v]),l.useEffect(()=>{if(g.current){g.current=!1;return}const t=a.current;if(!t||!N.current)return;const r=t.innerHTML,n=v||"",o=m=>m.replace(/\s+/g," ").trim();o(r)!==o(n)&&(t.innerHTML=n)},[v]),l.useEffect(()=>{const t=()=>{const r=a.current;r&&document.activeElement===r&&(d(),D())};return document.addEventListener("selectionchange",t),()=>document.removeEventListener("selectionchange",t)},[d,D]),l.useEffect(()=>()=>{C.current&&clearTimeout(C.current)},[]);const b=t=>`${z} ${W[t]?Y:_}`,te=["#333333","#080C14","#FF0000","#00FF00","#0000FF","#FFFF00","#FF00FF","#00FFFF","#FFA500","#800080","#008000","#000080","#FF1493","#4B0082","#556B2F","#8B4513","#2F4F4F","#DC143C","#00CED1","#808080","#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#009BE2"];return e.jsxs("div",{className:`border border-gray-300 rounded-lg overflow-visible bg-white shadow-sm ${O}`,children:[e.jsx("div",{className:"border-b bg-gray-50 px-3 py-2 overflow-visible",children:e.jsxs("div",{className:"flex items-center gap-2 min-w-min flex-wrap overflow-visible",children:[e.jsx("div",{className:"flex items-center gap-1 border-r border-gray-300 pr-3 mr-3",children:e.jsxs("select",{onChange:t=>Q(t.target.value),className:"text-sm border border-gray-300 rounded px-2 py-1 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500",defaultValue:"normal",children:[e.jsx("option",{value:"normal",children:"Normal"}),e.jsx("option",{value:"1",children:"H1"}),e.jsx("option",{value:"2",children:"H2"}),e.jsx("option",{value:"3",children:"H3"}),e.jsx("option",{value:"4",children:"H4"}),e.jsx("option",{value:"5",children:"H5"}),e.jsx("option",{value:"6",children:"H6"}),e.jsx("option",{value:"7",children:"H7"})]})}),e.jsxs("div",{className:"flex items-center gap-1 border-r border-gray-300 pr-3 mr-3",children:[e.jsx("button",{type:"button",onMouseDown:t=>t.preventDefault(),onClick:()=>p("bold"),className:b("bold"),title:"Bold (Ctrl+B)",children:e.jsx(le,{size:14})}),e.jsx("button",{type:"button",onMouseDown:t=>t.preventDefault(),onClick:()=>p("italic"),className:b("italic"),title:"Italic (Ctrl+I)",children:e.jsx(oe,{size:14})}),e.jsx("button",{type:"button",onMouseDown:t=>t.preventDefault(),onClick:()=>p("underline"),className:b("underline"),title:"Underline (Ctrl+U)",children:e.jsx(ne,{size:14})})]}),e.jsxs("div",{className:"flex items-center gap-1 border-r border-gray-300 pr-3 mr-3 relative",children:[e.jsx("button",{type:"button",onMouseDown:t=>t.preventDefault(),onClick:()=>F(!H),className:`${z} hover:bg-gray-200`,title:"Text Color",children:e.jsx(se,{size:14})}),H&&e.jsxs("div",{className:"fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded-xl shadow-2xl p-6",style:{zIndex:9999,minWidth:"300px"},children:[e.jsxs("div",{className:"flex justify-between items-center mb-4",children:[e.jsx("h3",{className:"text-lg font-semibold",children:"Choose Color"}),e.jsx("button",{onClick:()=>F(!1),className:"text-gray-500 hover:text-gray-700 text-xl",children:"×"})]}),e.jsx("div",{className:"grid grid-cols-6 gap-2 mb-4",children:te.map(t=>e.jsx("button",{type:"button",onClick:()=>A(t),className:"w-10 h-10 rounded-lg border-2 border-gray-200 hover:scale-110 transition-transform hover:border-blue-500",style:{backgroundColor:t}},t))}),e.jsxs("div",{className:"pt-3 border-t border-gray-200",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Custom Color"}),e.jsx("input",{type:"color",onChange:t=>A(t.target.value),className:"w-full h-12 cursor-pointer rounded-lg",value:G})]})]})]}),e.jsxs("div",{className:"flex items-center gap-1 border-r border-gray-300 pr-3 mr-3 relative",children:[e.jsxs("button",{type:"button",onMouseDown:t=>t.preventDefault(),onClick:()=>T(!M),className:`${z} hover:bg-gray-200 relative`,title:"Insert Image",children:[e.jsx(P,{size:14}),$&&e.jsxs("span",{className:"absolute -top-1 -right-1 w-3 h-3",children:[e.jsx("span",{className:"animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"}),e.jsx("span",{className:"relative inline-flex rounded-full h-3 w-3 bg-blue-500"})]})]}),M&&e.jsxs("div",{className:"absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-20 min-w-45",children:[e.jsxs("button",{type:"button",onClick:X,className:"w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded transition flex items-center gap-2",disabled:$,children:[e.jsx(P,{size:14,className:"text-blue-500"}),"Upload & Insert Image"]}),e.jsx("div",{className:"text-xs text-gray-400 px-3 py-1 border-t border-gray-100 mt-1",children:"Max 5MB • JPG, PNG, GIF, WebP"})]}),e.jsx("input",{ref:E,type:"file",accept:"image/*",onChange:Z,className:"hidden"})]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onMouseDown:t=>t.preventDefault(),onClick:()=>U("ul"),className:b("insertUnorderedList"),title:"Bulleted List",children:e.jsx(ae,{size:14})}),e.jsx("button",{type:"button",onMouseDown:t=>t.preventDefault(),onClick:()=>U("ol"),className:b("insertOrderedList"),title:"Numbered List",children:e.jsx(ie,{size:14})})]})]})}),e.jsx("div",{style:{height:k,overflow:"auto"},children:e.jsx("div",{ref:a,contentEditable:!0,suppressContentEditableWarning:!0,onInput:K,className:"p-4 min-h-full focus:outline-none prose max-w-none overflow-auto editor-placeholder",style:{minHeight:k},"data-placeholder":S,"aria-label":S,role:"textbox","aria-multiline":"true"})}),J&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",children:e.jsxs("div",{className:"bg-white rounded-xl shadow-2xl max-w-md w-full p-6",children:[e.jsx("h3",{className:"text-lg font-bold mb-4",children:"Image Settings"}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Width (px)"}),e.jsx("input",{type:"number",min:"50",max:"1200",value:s.width,onChange:t=>h({...s,width:parseInt(t.target.value)||400}),className:"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Alignment"}),e.jsxs("div",{className:"flex gap-4",children:[e.jsxs("label",{className:"flex items-center gap-2",children:[e.jsx("input",{type:"radio",value:"left",checked:s.alignment==="left",onChange:()=>h({...s,alignment:"left"})}),"Left"]}),e.jsxs("label",{className:"flex items-center gap-2",children:[e.jsx("input",{type:"radio",value:"center",checked:s.alignment==="center",onChange:()=>h({...s,alignment:"center"})}),"Center"]}),e.jsxs("label",{className:"flex items-center gap-2",children:[e.jsx("input",{type:"radio",value:"right",checked:s.alignment==="right",onChange:()=>h({...s,alignment:"right"})}),"Right"]})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Alt Text"}),e.jsx("input",{type:"text",value:s.alt,onChange:t=>h({...s,alt:t.target.value}),placeholder:"Image description",className:"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"})]})]}),e.jsxs("div",{className:"flex justify-end gap-3 mt-6",children:[e.jsx("button",{onClick:()=>L(!1),className:"px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition",children:"Cancel"}),e.jsx("button",{onClick:ee,className:"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition",children:"Insert Image"})]})]})}),e.jsx("style",{children:`
        /* Editor placeholder */
        .editor-placeholder:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }

        /* Global element styles - these apply to ALL content */
        .editor-placeholder h1,
        .editor-placeholder h2 {
          font-weight: 700;
          color: #080C14;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .editor-placeholder h1 { font-size: 1.5rem; }
        .editor-placeholder h2 { font-size: 1.5rem; }
        .editor-placeholder h3 {
          font-weight: 700;
          color: #080C14;
          font-size: 1.25rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .editor-placeholder h4 {
          font-weight: 700;
          color: #080C14;
          font-size: 1.125rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .editor-placeholder h5 {
          font-weight: 700;
          color: #080C14;
          font-size: 1rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .editor-placeholder h6 {
          font-weight: 700;
          color: #080C14;
          font-size: 0.875rem;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .editor-placeholder h7 {
          font-weight: 700;
          color: #080C14;
          font-size: 0.875rem;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        .editor-placeholder p {
          font-weight: 400;
          font-size: 1rem;
          color: #333333;
          line-height: 1.625;
          margin-bottom: 1rem;
        }

        .editor-placeholder strong {
          color: #009BE2;
          font-weight: 700;
        }

        .editor-placeholder ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .editor-placeholder ul li {
          margin-bottom: 0.75rem;
        }

        .editor-placeholder ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .editor-placeholder ol li {
          margin-bottom: 0.75rem;
        }

        .editor-placeholder li {
          font-weight: 400;
          font-size: 1rem;
          color: #333333;
          line-height: 1.625;
        }

        .editor-placeholder img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }

        .editor-placeholder a {
          color: #009BE2;
          text-decoration: underline;
        }

        .editor-placeholder blockquote {
          border-left: 4px solid #009BE2;
          padding-left: 1rem;
          font-style: italic;
          color: #333333;
        }

        .editor-placeholder code {
          background-color: #f3f4f6;
          border-radius: 0.25rem;
          padding: 0.125rem 0.5rem;
          font-size: 0.875rem;
          font-family: monospace;
        }

        .editor-placeholder hr {
          border-top: 1px solid #d1d5db;
          margin: 2rem 0;
        }

        .editor-placeholder .clearfix::after {
          content: "";
          display: table;
          clear: both;
        }

        /* Responsive breakpoints */
        @media (min-width: 640px) {
          .editor-placeholder h1,
          .editor-placeholder h2 { font-size: 2rem; }
          .editor-placeholder h3 { font-size: 1.75rem; }
          .editor-placeholder h4 { font-size: 1.5rem; }
          .editor-placeholder h5 { font-size: 1.25rem; }
          .editor-placeholder h6 { font-size: 1.125rem; }
          .editor-placeholder h7 { font-size: 1rem; }
          .editor-placeholder p,
          .editor-placeholder li {
            font-size: 1.125rem;
          }
        }

        @media (min-width: 1024px) {
          .editor-placeholder h1,
          .editor-placeholder h2 { font-size: 2.5rem; }
          .editor-placeholder h3 { font-size: 2.25rem; }
          .editor-placeholder h4 { font-size: 2rem; }
          .editor-placeholder h5 { font-size: 1.75rem; }
          .editor-placeholder h6 { font-size: 1.5rem; }
          .editor-placeholder h7 { font-size: 1.25rem; }
          .editor-placeholder p,
          .editor-placeholder li {
            font-size: 1.25rem;
          }
        }
      `})]})};export{ue as R};
