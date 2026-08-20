import{j as l}from"./app-DrTgUkPP.js";import{s as p}from"./sectionHelpers-Bkr07Go9.js";import"./purify.es-CqxHTgmJ.js";const g=t=>t==null?!1:typeof t=="string"?t.trim().length>0:Array.isArray(t)?t.length>0:typeof t=="object"?Object.keys(t).length>0:!0,u=({data:t,textData:n,textContentSection:o,bgColor:x="bg-white",paddingY:h="py-10 sm:py-15 md:py-25 lg:py-37.5",paddingX:m="px-5 sm:px-10 md:px-20 lg:px-50",maxWidth:s="max-w-4xl lg:max-w-6xl",sectionClassName:a="",sectionId:i="text-content"})=>{let e=t||n||o;e.data&&typeof e.data=="object"&&(e=e.data);const{content:_={}}=e,r=_.html||_.content||_.text||"";if(!g(r))return null;const d=p(r);return l.jsx("section",{id:i,className:`${x} ${m} ${h} ${a}`,children:l.jsx("div",{className:`mx-auto ${s}`,children:l.jsx("div",{className:`max-w-none\r
                     [&_h1]:text-3xl sm:[&_h1]:text-4xl lg:[&_h1]:text-5xl [&_h1]:font-700 [&_h1]:text-[#080C14] [&_h1]:mt-8 [&_h1]:mb-4\r
                     [&_h2]:text-2xl sm:[&_h2]:text-3xl lg:[&_h2]:text-4xl [&_h2]:font-700 [&_h2]:text-[#080C14] [&_h2]:mt-8 [&_h2]:mb-4\r
                     [&_h3]:text-xl sm:[&_h3]:text-2xl lg:[&_h3]:text-3xl [&_h3]:font-700 [&_h3]:text-[#080C14] [&_h3]:mt-6 [&_h3]:mb-3\r
                     [&_h4]:text-lg sm:[&_h4]:text-xl lg:[&_h4]:text-2xl [&_h4]:font-700 [&_h4]:text-[#080C14] [&_h4]:mt-6 [&_h4]:mb-3\r
                     [&_h5]:text-base sm:[&_h5]:text-lg lg:[&_h5]:text-xl [&_h5]:font-700 [&_h5]:text-[#080C14] [&_h5]:mt-4 [&_h5]:mb-2\r
                     [&_h6]:text-sm sm:[&_h6]:text-base lg:[&_h6]:text-lg [&_h6]:font-700 [&_h6]:text-[#080C14] [&_h6]:mt-4 [&_h6]:mb-2\r
                     [&_p]:text-base sm:[&_p]:text-lg lg:[&_p]:text-xl [&_p]:leading-relaxed [&_p]:mb-4\r
                     [&_strong]:font-700\r
                     [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-3 [&_ul]:mb-6\r
                     [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-3 [&_ol]:mb-6\r
                     [&_li]:text-base sm:[&_li]:text-lg lg:[&_li]:text-xl [&_li]:leading-relaxed\r
                     [&_a]:underline hover:[&_a]:no-underline\r
                     [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic\r
                     [&_code]:bg-gray-100 [&_code]:rounded [&_code]:px-2 [&_code]:py-1 [&_code]:text-sm [&_code]:font-mono\r
                     [&_hr]:border-t [&_hr]:border-gray-300 [&_hr]:my-8\r
                     [&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto\r
                     [&_pre]:overflow-auto [&_pre]:whitespace-pre-wrap [&_pre]:break-all [&_pre]:p-4 [&_pre]:bg-gray-50 [&_pre]:rounded-lg\r
          `,dangerouslySetInnerHTML:{__html:d}})})})};export{u as default};
