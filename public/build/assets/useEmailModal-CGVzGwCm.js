import{r as i,j as e,b as N}from"./app-DrTgUkPP.js";import{S as x}from"./sweetalert2.esm.all-0Z_61IYw.js";import{v as A,al as M,am as q,z as F,o as R,an as L}from"./index-B3nNzE1w.js";const S={shortlisted:{name:"Shortlisted - Interview Invitation",subject:"Congratulations! You've been Shortlisted - Interview Invitation",content:`<p>Congratulations! We are pleased to inform you that your application has been shortlisted for the next stage of our recruitment process.</p>

<p>We were impressed with your qualifications and experience, and we would like to invite you for an interview to discuss your potential contribution to our team.</p>

<p><strong>Interview Details:</strong><br>
• Date: [Date to be confirmed]<br>
• Time: [Time to be confirmed]<br>
• Location/Venue: [Online or Office Address]<br>
• Duration: Approximately 45-60 minutes</p>

<p><strong>What to prepare:</strong><br>
• Updated resume/CV<br>
• Portfolio (if applicable)<br>
• Government-issued ID<br>
• Any certificates or credentials mentioned in your application</p>

<p>Please reply to this email within 3 business days to confirm your availability for the interview. You can suggest alternative time slots if the proposed schedule doesn't work for you.</p>

<p>We look forward to meeting you and learning more about your qualifications!</p>

<p>Best regards,<br>
<strong>Hiring Team</strong></p>`},rejected:{name:"Application Status Update - Not Selected",subject:"Update on Your Application",content:`<p>Thank you for your interest in joining our team and for taking the time to apply for the position.</p>

<p>After careful consideration of all applications, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely align with our current requirements for this role.</p>

<p>This was a difficult decision as we received many strong applications. We encourage you to keep an eye on our careers page for future opportunities that may be a better match for your skills and experience.</p>

<p>We appreciate your interest in our company and wish you the very best in your job search and future career endeavors.</p>

<p>Thank you again for your application.</p>

<p>Sincerely,<br>
<strong>Hiring Team</strong></p>`},hired:{name:"Job Offer - Congratulations!",subject:"Job Offer: Congratulations on Your Selection!",content:`<p><strong>🎉 Congratulations! 🎉</strong></p>

<p>We are absolutely delighted to inform you that you have been selected for the position! After a thorough review process, we were thoroughly impressed with your skills, experience, and enthusiasm.</p>

<p><strong>Offer Details:</strong><br>
• Position: [Job Title]<br>
• Start Date: [Proposed Start Date]<br>
• Working Hours: [Full-time/Part-time/Flexible]<br>
• Compensation Package: As discussed during the interview process</p>

<p><strong>Next Steps:</strong><br>
1. Please review the attached offer letter and employment agreement<br>
2. Complete the online onboarding form (link below)<br>
3. Submit required documents for background verification<br>
4. Schedule your first day orientation</p>

<p><strong>To accept this offer:</strong><br>
Please reply to this email confirming your acceptance by [Date]. Once we receive your acceptance, we will proceed with the onboarding process and provide you with more detailed information about your first day.</p>

<p>If you have any questions or need clarification on any aspect of the offer, please don't hesitate to reach out. We want to ensure you have all the information you need to make an informed decision.</p>

<p>We're excited about the possibility of you joining our team and can't wait to see the great things we'll accomplish together!</p>

<p>Warmest congratulations,<br>
<strong>Hiring Team</strong></p>`},pending:{name:"Application Received - Under Review",subject:"Application Received - We're Reviewing Your Profile",content:`<p>Thank you for submitting your application for the position at our company.</p>

<p>We have received your application and our hiring team is currently reviewing it carefully. We appreciate your interest in joining our organization and we're excited about the possibility of working with you.</p>

<p><strong>What happens next?</strong><br>
• Our team will review your qualifications against the role requirements<br>
• If shortlisted, you will receive an interview invitation within 5-7 business days<br>
• We will keep you updated on your application status via email</p>

<p>In the meantime, feel free to:<br>
• Check out our company blog to learn more about our culture<br>
• Follow us on social media for company updates<br>
• Prepare any additional materials that might strengthen your application</p>

<p>We truly appreciate your patience during this process. We receive many applications for each position, but we personally review each one to find the best fit for our team.</p>

<p>Thank you again for considering us as your potential employer.</p>

<p>Best regards,<br>
<strong>Hiring Team</strong></p>`},interview_followup:{name:"Post-Interview Follow-up",subject:"Thank You for Your Interview",content:`<p>Thank you for taking the time to interview with us for the position. It was a pleasure meeting you and learning more about your background and aspirations.</p>

<p>We were impressed with your insights and the thoughtful questions you raised during our conversation. Your experience in [specific area] particularly stood out to us.</p>

<p><strong>Next Steps:</strong><br>
• Our team will be reviewing all interviewed candidates this week<br>
• We expect to make a decision by [Date]<br>
• We will contact you regarding the outcome, regardless of the final decision</p>

<p>If you have any additional information you'd like to share or questions that have come up since our conversation, please don't hesitate to reach out.</p>

<p>Thank you again for your interest in joining our team. We look forward to potentially working together!</p>

<p>Warm regards,<br>
<strong>Hiring Team</strong></p>`},document_request:{name:"Additional Documents Request",subject:"Additional Information Required for Your Application",content:`<p>Thank you for your interest in the position at our company. Your application has progressed to the next stage of our review process.</p>

<p>To proceed further, we kindly request the following additional documents/information:</p>

<p><strong>Required Documents:</strong><br>
• Copy of your educational certificates (Bachelor's/Master's degree)<br>
• Professional certification documents<br>
• Portfolio or work samples (if applicable)<br>
• References (at least 2 professional contacts)<br>
• Portfolio or work samples demonstrating relevant projects</p>

<p>Please submit these documents by [Date] through your application dashboard or by replying to this email with the attachments.</p>

<p>Once we receive these documents, we will continue with our evaluation process and contact you regarding the next steps.</p>

<p>Thank you for your cooperation and understanding.</p>

<p>Best regards,<br>
<strong>Hiring Team</strong></p>`},custom:{name:"Custom Message",subject:"",content:""}},_=({isOpen:m,onClose:c,recipients:r,onSuccess:p,title:w="Send Email",jobTitle:h=null})=>{const[l,b]=i.useState(!1),[s,f]=i.useState(!1),[v,y]=i.useState(""),[n,g]=i.useState({subject:"",content:""});if(i.useEffect(()=>{m&&(g({subject:"",content:""}),y(""),f(!1))},[m,r]),!m)return null;const T=()=>{if(!r||r.length===0)return"";if(r.length===1){const t=r[0];return`To: ${t.name} (${t.email})`}return`To: ${r.length} selected applicant(s)`},E=t=>{if(t==="custom"){g({subject:"",content:""}),y("custom");return}const o=S[t];o&&(g({subject:o.subject,content:o.content}),y(t))},j=t=>{const{name:o,value:u}=t.target;g(a=>({...a,[o]:u})),o==="content"&&y("")},C=t=>{const o=document.getElementById("email-content-textarea");if(!o)return;const u=o.selectionStart,a=o.selectionEnd,d=n.content,D=d.substring(0,u),W=d.substring(a);g({...n,content:D+t+W}),setTimeout(()=>{o.focus();const k=u+t.length;o.setSelectionRange(k,k)},0)},P=async()=>{var t,o,u;if(!n.subject.trim()){x.fire({icon:"warning",title:"Missing Subject",text:"Please enter an email subject.",confirmButtonColor:"#3b82f6"});return}if(!n.content.trim()){x.fire({icon:"warning",title:"Missing Content",text:"Please enter email content.",confirmButtonColor:"#3b82f6"});return}b(!0);try{let a;if(r.length===1?a=await N.post(route("backend.applications.send-email",r[0].id),{subject:n.subject,content:n.content}):a=await N.post(route("backend.applications.bulk-send-email"),{application_ids:r.map(d=>d.id),subject:n.subject,content:n.content}),a.data.success){let d=a.data.message;a.data.failed_emails&&a.data.failed_emails.length>0&&(d+=`

Failed emails: ${a.data.failed_emails.join(", ")}`),x.fire({icon:((t=a.data.failed_emails)==null?void 0:t.length)>0?"warning":"success",title:"Email Process Completed",text:d,confirmButtonColor:"#3b82f6"}),p==null||p(),c()}else throw new Error(a.data.message)}catch(a){x.fire({icon:"error",title:"Failed to Send Email",text:((u=(o=a.response)==null?void 0:o.data)==null?void 0:u.message)||a.message||"An error occurred while sending the email.",confirmButtonColor:"#d33"})}finally{b(!1)}},I=[{label:"Interview Date",value:"<p><strong>Interview Date:</strong> [Insert Date]</p>"},{label:"Location/Link",value:"<p><strong>Location:</strong> [Insert Address/Zoom Link]</p>"},{label:"Document List",value:"<p><strong>Required Documents:</strong><br>• Document 1<br>• Document 2</p>"},{label:"Deadline",value:"<p><strong>Deadline:</strong> [Insert Date]</p>"},{label:"Job Title",value:h?`<p><strong>Position:</strong> ${h}</p>`:"<p><strong>Position:</strong> [Job Title]</p>"}];return e.jsxs("div",{className:"fixed inset-0 z-50 flex items-center justify-center px-4",children:[e.jsx("div",{className:"absolute inset-0 bg-black/50 backdrop-blur-sm",onClick:()=>!l&&c()}),e.jsxs("div",{className:"relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden",children:[e.jsxs("div",{className:"flex items-center justify-between px-6 py-4 border-b bg-linear-to-r from-blue-50 to-purple-50",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2 bg-blue-100 rounded-xl",children:e.jsx(A,{className:"text-blue-600"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:w}),e.jsx("p",{className:"text-xs text-gray-600",children:T()})]})]}),e.jsx("button",{onClick:c,className:"text-gray-400 hover:text-gray-600",children:"✕"})]}),e.jsxs("div",{className:"p-6 space-y-6 max-h-[75vh] overflow-y-auto",children:[e.jsxs("div",{className:"bg-gray-50 border rounded-xl p-4",children:[e.jsxs("p",{className:"text-sm font-medium text-gray-700 mb-3 flex items-center gap-2",children:[e.jsx(M,{className:"text-purple-500"}),"Quick Templates"]}),e.jsx("div",{className:"flex flex-wrap gap-2",children:Object.entries(S).map(([t,o])=>e.jsx("button",{onClick:()=>E(t),className:`px-3 py-1.5 text-xs rounded-full border transition-all
                  ${v===t?"bg-purple-600 text-white border-purple-600 shadow":"bg-white text-gray-600 border-gray-300 hover:bg-purple-50 hover:border-purple-300"}`,children:o.name},t))})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium text-gray-700",children:"Subject *"}),e.jsx("input",{type:"text",name:"subject",value:n.subject,onChange:j,placeholder:"Enter email subject...",className:"mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm",disabled:l})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex justify-between items-center mb-1",children:[e.jsx("label",{className:"text-sm font-medium text-gray-700",children:"Email Content *"}),e.jsxs("button",{type:"button",onClick:()=>f(!s),className:"text-xs text-blue-600 hover:underline flex items-center gap-1",children:[s?e.jsx(q,{}):e.jsx(F,{}),s?"Edit":"Preview"]})]}),s?e.jsxs("div",{className:"border rounded-lg overflow-hidden shadow-sm",children:[e.jsx("div",{className:"bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600",children:"Preview"}),e.jsx("div",{className:"p-4 bg-white max-h-96 overflow-y-auto",children:e.jsx("div",{className:"prose prose-sm max-w-none text-gray-700",dangerouslySetInnerHTML:{__html:`
                      <h2>${n.subject}</h2>
                      ${n.content}
                    `}})})]}):e.jsxs(e.Fragment,{children:[e.jsx("textarea",{id:"email-content-textarea",name:"content",rows:12,value:n.content,onChange:j,placeholder:"Write your email content here... (HTML supported)",className:"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono shadow-sm",disabled:l}),e.jsx("p",{className:"text-xs text-gray-500 mt-1",children:"Supports HTML tags like <strong>, <br>, <ul>"})]})]}),!s&&e.jsxs("div",{className:"bg-blue-50 border border-blue-100 rounded-xl p-3",children:[e.jsx("p",{className:"text-xs font-medium text-blue-800 mb-2",children:"Quick Insert"}),e.jsx("div",{className:"flex flex-wrap gap-2",children:I.map((t,o)=>e.jsxs("button",{onClick:()=>C(t.value),className:"text-xs px-2 py-1 bg-white border border-blue-200 rounded hover:bg-blue-100",children:["+ ",t.label]},o))})]})]}),e.jsxs("div",{className:"flex justify-between items-center px-6 py-4 border-t bg-gray-50",children:[e.jsx("button",{onClick:c,disabled:l,className:"px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-50",children:"Cancel"}),e.jsx("button",{onClick:P,disabled:l||!n.subject.trim()||!n.content.trim(),className:"px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow",children:l?e.jsxs(e.Fragment,{children:[e.jsx(R,{className:"animate-spin"}),"Sending..."]}):e.jsxs(e.Fragment,{children:[e.jsx(L,{}),"Send Email",(r==null?void 0:r.length)>1?"s":""]})})]})]})]})},B=()=>{const[m,c]=i.useState(!1),[r,p]=i.useState([]),[w,h]=i.useState("Send Email"),l=i.useCallback((s,f="Send Email")=>{const v=Array.isArray(s)?s:[s];p(v),h(f),c(!0)},[]),b=i.useCallback(()=>{c(!1),p([])},[]);return{isEmailModalOpen:m,emailRecipients:r,emailModalTitle:w,openEmailModal:l,closeEmailModal:b}};export{_ as E,B as u};
