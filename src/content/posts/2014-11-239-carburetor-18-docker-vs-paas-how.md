---
title: 239 Carburetor 18 - Docker vs PaaS - How Docker disrupt the PaaS space
date: 2014-11-17T13:39:00.000Z
tags:
  - carburetor
episode: 239
audio_url: https://m.reversim.com/reversim239_carburetor18.mp3
cover_image: /images/blogger/fdbe6b57c6c90f5afed1.png
legacy_url: https://www.reversim.com/2014/11/239-carburetor-18-docker-vs-paas-how.html
legacy_path: /2014/11/239-carburetor-18-docker-vs-paas-how
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="rtl" style="text-align: right;">
<span id="docs-internal-guid-793beb67-bdf5-8fcc-a21e-bcfcb0acaf9f"></span></div>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<a href="/podcast/images/blogger/fdbe6b57c6c90f5afed1.png" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" height="177" src="/podcast/images/blogger/fdbe6b57c6c90f5afed1.png" width="200"></a><a href="https://www.youtube.com/watch?v=O8UdYd1HgG8" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">רן, אורי ונתי</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> מראים לכם איך עושים את זה - PaaS, Containers וכל מה שביניהם. קרבורטור 18 יוצא לדרך.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> גוגל יספקו את </span><a href="https://github.com/googlecloudplatform/kubernetes" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Kubernetes</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> </span><a href="http://googlecloudplatform.blogspot.co.il/2014/11/google-cloud-platform-live-introducing-container-engine-cloud-networking-and-much-more.html" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">כשירות</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">אז לאיזה אפליקציות PaaS - כמו שהכרנו אותו עד היום - בכלל מתאים? בדרך כלל לדברים די פשוטים.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">חומרה או VM נותן הרבה יותר חופש, אבל דורש הרבה יותר עבודה.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">בין ה-PaaS לבין ה-DIY, מתחילות לצוץ אפשרויות ביניים נוספות.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<a href="https://drive.google.com/file/d/0B08OlFC8kvtkNTZkaDFUdklmSGs/view?usp=sharing" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">ככה זה נראה</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> בצורה פשוטה יותר.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">כמו בכל דבר אחר, גם פה - עם כוח גדול יותר, יש אחריות גדולה יותר וצורך גדול יותר בשליטה.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">גוגל גדולים וחזקים מספיק, בשביל להציע features ברמה שלא תתאפשר לכל אחד אחר (כמו שירותי רוחב פס מובטחים וכו')</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">האם גם Micro$oft יצטרפו לחגיגה?</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">פתרונות PaaS ודומיהם מבטלים את הצורך של המשתמשים להבין מה קורה מתחת למכסה המנוע, דבר שעלול בהמשך הדרך לפגוע בגדילה של החברה.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">מצד שני, לא תמיד יש צורך לדעת כל-כך הרבה.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">האם PaaS איבדו מקסמם, לאור אפשרויות ה-Deployment שנוצרו לאחרונה?</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">היכולת להריץ container ב-cloud היא מכפיל כוח משמעותי.</span></div>
</li>
</ul>
<div style="text-align: right;">
<span style="font-family: Arial;"><span style="font-size: 15px; line-height: 17.25px; white-space: pre-wrap;"><br></span></span></div>
<div dir="rtl" style="text-align: right;">
הקובץ נמצא <a href="http://m.reversim.com/reversim239_carburetor18.mp3">כאן</a>, האזנה נעימה ותודה רבה ליותם על התמלול</div>
<div dir="rtl" style="text-align: right;">
<br></div>
</div>
<div style="clear: both;"></div>
</div>
