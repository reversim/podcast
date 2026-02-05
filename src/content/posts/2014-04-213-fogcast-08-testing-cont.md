---
title: "213: Fogcast 08 - Testing (cont)"
date: 2014-04-27T18:13:00.000Z
tags:
  - fogcast
episode: 213
audio_url: http://m.reversim.com/reversim213_fogcast08.mp3
cover_image: https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgg2O_xoip8wVFB11whFfgEpnlcypZ13mQW-JQIKqOLUZtiYoMfx5nalSlRL6Zka8zbeMiYH01gJ04BHOPelu6T3X_Nv5AvCRMAWKuQtgrw7QgMSCwIfngLTjUqsgJO6sa5UoYulzyXHm4/s1600/ClearingTheFog.jpg
legacy_url: https://www.reversim.com/2014/04/213-fogcast-08-testing-cont.html
legacy_path: /2014/04/213-fogcast-08-testing-cont
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">ליאור ורן - Testing, continued</span></div>
<div class="separator" style="clear: both; text-align: center;">
<a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgg2O_xoip8wVFB11whFfgEpnlcypZ13mQW-JQIKqOLUZtiYoMfx5nalSlRL6Zka8zbeMiYH01gJ04BHOPelu6T3X_Nv5AvCRMAWKuQtgrw7QgMSCwIfngLTjUqsgJO6sa5UoYulzyXHm4/s1600/ClearingTheFog.jpg" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" height="100" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgg2O_xoip8wVFB11whFfgEpnlcypZ13mQW-JQIKqOLUZtiYoMfx5nalSlRL6Zka8zbeMiYH01gJ04BHOPelu6T3X_Nv5AvCRMAWKuQtgrw7QgMSCwIfngLTjUqsgJO6sa5UoYulzyXHm4/s1600/ClearingTheFog.jpg" width="200"></a></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">אילו סוגי בדיקות קיימים</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">מה הקשר בין Continuous Integration לבדיקות?</span></div>
</li>
</ul>
<div dir="rtl" style="text-align: right;">
<b id="docs-internal-guid-90191daf-a462-9a46-3918-70592150a4ac" style="font-weight: normal;"><br></b></div>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">ליאור ורן נותנים בהם סימנים:</span></div>
</li>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">Unit &nbsp;- פונקציה בודדת</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">Integration - בדיקה של מס' רכיבים</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">Blackbox - בדיקות של הקוד דרך הממשק החיצוני (בפועל, סוג של Integration)</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">פרפורמנס &amp; סקייל</span></div>
</li>
</ul>
</ul>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">האם חשוב למתוח את הגבול במדיוק בין Unit ל Integration?</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">השאלה החשובה היא מה הדרך האפקטיבית ביותר לבדוק את הקוד -</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">בדיקות היחידה מובילות - קלות ביותר למימוש, רצות מהר יותר, ובעלות ה ROI הגבוה ביותר</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">החסרון היחידי שלהם.. טוב, הם רק בדיקות יחידה.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">כלל אצבע - 20 / 80. 80 אחוז בדיקות יחידה, 20 אחוז Integration.</span></div>
</li>
</ul>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">האנרגיה שלנו מוגבלת - אולי כדאי להשקיע בעיקר בבדיקות ישירות של סביבת הייצור.</span></div>
</li>
</ul>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">מה הכוונה? ניטור פולשני ביותר של סביבת הייצור -</span></div>
</li>
</ul>
<div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-right: 36pt; margin-top: 0pt; text-align: right; text-indent: 36pt;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> </span><a href="http://codeascraft.com/2011/02/15/measure-anything-measure-everything/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">If it moves, graph it. &nbsp;If it doesn't move, graph it anyway</span></a></div>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">..אבל מה לגבי גילוי מוקדם? שיכול היה למנוע את המעבר לייצור מלכתחילה.</span></div>
</li>
</ul>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">חוות הקופים של Netflix:</span></div>
</li>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<a href="http://techblog.netflix.com/2011/07/netflix-simian-army.html" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Simian Army</span></a></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<a href="https://github.com/Netflix/SimianArmy/wiki/Chaos-Monkey" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Chaos Monkey</span></a></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<a href="https://github.com/Netflix/SimianArmy/wiki/Conformity-Home" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Conformity Monkey</span></a></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<a href="https://github.com/Netflix/SimianArmy/wiki/Janitor-Home" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Janitor Monkey</span></a></div>
</li>
</ul>
</ul>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="text-align: right;">
הקובץ נמצא <a href="http://m.reversim.com/reversim213_fogcast08.mp3">כאן</a>, האזנה נעימה ותודה רבה לאורן אפרתי על התמלול</div>
</div>
<div style="clear: both;"></div>
</div>
