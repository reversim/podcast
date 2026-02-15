---
title: 184 Carburetor 8 Build Your Own PaaS
date: 2013-06-09T12:29:00.000Z
tags:
  - carburetor
  - paas
  - virtualization
episode: 184
audio_url: https://m.reversim.com/reversim184_carburetor8_build_your_own_pass.mp3
cover_image: /images/blogger/unavailable.svg
legacy_url: https://www.reversim.com/2013/06/184-carburetor-8-build-your-own-paas.html
legacy_path: /2013/06/184-carburetor-8-build-your-own-paas
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="rtl" style="text-align: right;">
<a href="http://www.coloandcloud.com/wp-content/uploads/2012/05/PaaS-Chart.gif" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" height="150" src="/podcast/images/blogger/unavailable.svg" width="200"></a></div>
<div dir="rtl" style="text-align: right;">
<b id="docs-internal-guid-3bf12ac0-28e8-fc28-c404-d350e870994b" style="font-weight: normal;"></b></div>
<div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<b id="docs-internal-guid-3bf12ac0-28e8-fc28-c404-d350e870994b" style="font-weight: normal;"><a href="//www.youtube.com/watch?v=odn8xSW4MfE" style="text-decoration: none;"><span style="color: #1155cc; font-family: Arial; font-size: 15px; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">יש דברים</span></a><span style="font-family: Arial; font-size: 15px; vertical-align: baseline; white-space: pre-wrap;"> שלא </span><a href="http://en.wikipedia.org/wiki/David_Hahn" style="text-decoration: none;"><span style="color: #1155cc; font-family: Arial; font-size: 15px; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">בונים לבד</span></a><span style="font-family: Arial; font-size: 15px; vertical-align: baseline; white-space: pre-wrap;">. </span><a href="http://en.wikipedia.org/wiki/Platform_as_a_service" style="text-decoration: none;"><span style="color: #1155cc; font-family: Arial; font-size: 15px; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">PaaS</span></a><span style="font-family: Arial; font-size: 15px; vertical-align: baseline; white-space: pre-wrap;"> הוא לא אחד מהם.</span></b></div>
<ul dir="rtl" style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<b id="docs-internal-guid-3bf12ac0-28e8-fc28-c404-d350e870994b" style="font-weight: normal;"><a href="//www.youtube.com/watch?v=IVoTLzA8CyI" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">פה בונים בכיף</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> </span><a href="https://upload.wikimedia.org/wikipedia/commons/c/ca/Christus_Ravenna.jpg" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">נתי שלום</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">, </span><a href="/podcast/images/blogger/8d9bcf3636b1f358481f.jpg).jpg" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">אורי להב</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> ו</span><a href="http://www.biography.com/imported/images/Biography/Images/Profiles/I/Judas-Iscariot-9358799-1-402.jpg" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">רן תבורי</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">.</span></b></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<b id="docs-internal-guid-3bf12ac0-28e8-fc28-c404-d350e870994b" style="font-weight: normal;"><a href="http://www.docker.io/" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Docker</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> משתמש </span><a href="http://lxc.sourceforge.net/" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">בלינוקס Container</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> בשביל להריץ תהליכים בנפרד - כמו VM אבל הרבה יותר קליל.</span></b></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<b id="docs-internal-guid-3bf12ac0-28e8-fc28-c404-d350e870994b" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">NodeJs מעל כל מכונה - </span><a href="https://github.com/mozilla/awsbox" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">AWSBOX</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">. הידד.</span></b></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<b id="docs-internal-guid-3bf12ac0-28e8-fc28-c404-d350e870994b" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">מטרת העל: יעילות, מפיתוח ל-Deployment בכמה שפחות זמן.</span></b></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<b id="docs-internal-guid-3bf12ac0-28e8-fc28-c404-d350e870994b" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">צריך VM שלם? יקר, יקר... בוא נתחיל ממשהו קטן יותר ואז נראה.</span></b></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<b id="docs-internal-guid-3bf12ac0-28e8-fc28-c404-d350e870994b" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">קטלוג של שירותים - ככה מפתחים מהר (ל-Cloudify יש חידוש בתחום - </span><a href="http://www.cloudifysource.org/cloudifyRecipeCatalog.html" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">שווה בדיקה</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">)</span></b></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<b id="docs-internal-guid-3bf12ac0-28e8-fc28-c404-d350e870994b" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">האם אתם DevOps או PaaS? </span></b></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<b id="docs-internal-guid-3bf12ac0-28e8-fc28-c404-d350e870994b" style="font-weight: normal;"><a href="http://incubator.apache.org/mesos/" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Mesos</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> עושה מה ש-</span><a href="http://www.wired.com/wiredenterprise/2013/03/google-borg-twitter-mesos/all/" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Borg של גוגל</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> עושה (ואולי למד כמה לקחים ממנו)</span></b></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<b id="docs-internal-guid-3bf12ac0-28e8-fc28-c404-d350e870994b" style="font-weight: normal;"><a href="http://eurosys2013.tudos.org/wp-content/uploads/2013/paper/Schwarzkopf.pdf" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">אומגה</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> כבר מחממת מנועים כמחליפה של Borg</span></b></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<b id="docs-internal-guid-3bf12ac0-28e8-fc28-c404-d350e870994b" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">Mesos דואג לבדוק שכל תנאי הבסיס להרצה של אפליקציה מתקיימים לפני שהוא מריץ אותה.</span></b></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<b id="docs-internal-guid-3bf12ac0-28e8-fc28-c404-d350e870994b" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">Mesos מבקש רשימה מסודרת של Resources מהאפליקציה על מנת להריץ אותה.</span></b></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<b id="docs-internal-guid-3bf12ac0-28e8-fc28-c404-d350e870994b" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">בגוגל הכול הוא Service, ולא צריך קשר עם החומרה. מגניב.</span></b></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<b id="docs-internal-guid-3bf12ac0-28e8-fc28-c404-d350e870994b" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">Mesos vs. OpenStack - מאז הטורף נגד הנוסע השמיני לא נראה כזה קרב. </span></b></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<b id="docs-internal-guid-3bf12ac0-28e8-fc28-c404-d350e870994b" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">DevOpsDays בישראל - </span><a href="http://devopsdays.org/events/2013-telaviv/propose/" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">כבר באים</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">. אם יש לכם הרצאות מעניינות - שתפו. אפשר גם Sponserships.</span></b></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<b id="docs-internal-guid-3bf12ac0-28e8-fc28-c404-d350e870994b" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">ILTechTalkWeek - השנה באאוטבריין, 7-11 ביולי. </span><a href="http://www.iltechtalks.org.il/" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">אל תפספסו</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">.</span></b></div>
</li>
</ul>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="text-align: right;">
הקובץ נמצא <a href="http://m.reversim.com/reversim184_carburetor8_build_your_own_pass.mp3">כאן</a>
האזנה נעימה
ותודה רבה ליותם אורון על התמלול!</div>
</div>
<div style="clear: both;"></div>
</div>
