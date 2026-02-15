---
title: 212 Fogcast 7 - Testing (or not)
date: 2014-04-07T21:09:00.000Z
tags:
  - fogcast
episode: 212
audio_url: https://m.reversim.com/reversim212_fogcast07.mp3
cover_image: /images/blogger/1dba2793fcd8cdd7b7a4.jpg
legacy_url: https://www.reversim.com/2014/04/212-fogcast-7-testing-or-not.html
legacy_path: /2014/04/212-fogcast-7-testing-or-not
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="rtl" style="text-align: right;">
<span id="docs-internal-guid-d1b8fa7a-3e03-e5c5-e520-ac65ef952728"></span></div>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div class="separator" style="clear: both; text-align: center;">
<a href="/podcast/images/blogger/1dba2793fcd8cdd7b7a4.jpg" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" height="100" src="/podcast/images/blogger/1dba2793fcd8cdd7b7a4.jpg" width="200"></a></div>
<div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">ליאור ורן - על Testing - כמה, למה ואיך..</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">נתחיל ב Devil's advocates:</span></div>
</li>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<a href="http://chris.thesturgills.com/2013/04/15/tests-are-overhyped/" style="text-decoration: none;"><span style="background-color: white; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Tests-are-overhyped</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"></span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<a href="http://www.rbcs-us.com/documents/Why-Most-Unit-Testing-is-Waste.pdf" style="text-decoration: none;"><span style="background-color: white; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Why-Most-Unit-Testing-is-Waste</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"></span></div>
</li>
</ul>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">איך קובעים איזה קוד כדאי לבדוק? </span></div>
</li>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">תלוי בשפה: דינמית / סטטית</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">גודל הצוות</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">אופי הצוות: ותיקים / צעירים</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">וגם אופי המוצר, בכל זאת יש הבדל בין מע' טייס אוטומטי לספירת RT בטוויטר</span></div>
</li>
</ul>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">מתכנתים מנוסים חושבים מראש בסגנון TDD - אולי פחות קורץ להם</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">האם טסטים מפריעים לתהליך הכתיבה?</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">מה משותף לתפוח וקוד? שניהם יכולים </span><a href="http://en.wikipedia.org/wiki/Software_rot" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">להירקב</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"></span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">טסטים עוזרים לריפקטור להרגיש בטוח יותר</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">קוד קוברג'? - אולי לא המטריקה החשובה ביותר</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">עבור שפות סטטיות הקומפיילר לוקח על עצמו חלק מהבדיקות</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">מתי לכתוב את הטסטים? בפועל לא יוצא לחזור אחורה לעשות טסטים. לכן הטסטים חייבים להיכתב במקביל לקוד. או לעולם לא</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">Code smell של טסטים: </span></div>
</li>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">קשים לתחזוק</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">נכשלים באופן לא עקבי</span></div>
</li>
</ul>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">השמורה של רן: קוד טסטבלי ⇔ מתוכנן היטב ⇔ מודולרי ⇔ שימושי</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">טסט פריימוורקס מומלצים:</span></div>
</li>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> ריילס </span><a href="https://github.com/rspec/rspec-rails" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">rspec</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"></span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> נוד </span><a href="http://visionmedia.github.io/mocha/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">mocha</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"></span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">פייתון </span><a href="https://nose.readthedocs.org/en/latest/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">nose</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"></span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: circle; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">CI? </span><a href="https://travis-ci.org/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">טרביס</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> ו </span><a href="https://circleci.com/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">circle</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"></span></div>
</li>
</ul>
</ul>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="text-align: right;">
הקובץ נמצא <a href="http://m.reversim.com/reversim212_fogcast07.mp3">כאן</a>
האזנה נעימה
ותודה רבה לאורן אפרתי על התמלול!</div>
</div>
<div style="clear: both;"></div>
</div>
