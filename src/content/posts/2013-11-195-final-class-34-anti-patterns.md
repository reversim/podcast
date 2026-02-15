---
title: 195 Final Class 34 - Anti Patterns
date: 2013-11-16T21:22:00.000Z
tags:
  - finalclass
episode: 195
audio_url: https://m.reversim.com/reversim195_finalclass34_anti-patterns.mp3
cover_image: https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhQ-OtGmnhyphenhyphenxcuKVPmYpjQxUnLNVGLx58CVuAXfRsY5PTKgcV7cIVyIHKfnDKxvBZns53f2B31Dqj-4phqMi8N-ah1udcN0ruuV34gON9y1bW3t-7IC5NOLRupj8kC9E25dXqsDw7nhLwE/s200/barbecue-crazy-tux-1800.png
legacy_url: https://www.reversim.com/2013/11/195-final-class-34-anti-patterns.html
legacy_path: /2013/11/195-final-class-34-anti-patterns
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="ltr" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">?</span><a href="http://sourcemaking.com/antipatterns" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">אנטי פטרנס</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> - או במלים אחרות, למה להיות חיוביים כל הזמן</span></div>
<div class="separator" style="clear: both; text-align: center;">
<a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhQ-OtGmnhyphenhyphenxcuKVPmYpjQxUnLNVGLx58CVuAXfRsY5PTKgcV7cIVyIHKfnDKxvBZns53f2B31Dqj-4phqMi8N-ah1udcN0ruuV34gON9y1bW3t-7IC5NOLRupj8kC9E25dXqsDw7nhLwE/s1600/barbecue-crazy-tux-1800.png" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" height="200" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhQ-OtGmnhyphenhyphenxcuKVPmYpjQxUnLNVGLx58CVuAXfRsY5PTKgcV7cIVyIHKfnDKxvBZns53f2B31Dqj-4phqMi8N-ah1udcN0ruuV34gON9y1bW3t-7IC5NOLRupj8kC9E25dXqsDw7nhLwE/s200/barbecue-crazy-tux-1800.png" width="200"></a></div>
<br>
<div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">התאשפזו בכפייה: ערן, ארז, עידו, איתי, יונתן ורן.</span></div>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<a href="http://en.wikipedia.org/wiki/Scaffold_(programming)" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Scaffolding</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> - לפעמים הפיגומים מחליפים את היסודות.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">חילול קוד אוטומטי - משהו מסריח בשפה?</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">קומפילציה מ CoffeeScript ל JavaScript עלולה להיות בעייתית ללא Source Maps,</span></div>
</li>
</ul>
<div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right; text-indent: 36pt;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">בדומה לקומפילציה בין LESS ל CSS.</span></div>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">איך אפשר בלי root of all evil - D. Knuth) Premature Optimization)? &nbsp;נפוץ במיוחד בנסיון למקבל תהליכים ע"ח סיבוך הביצוע.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">טיפ מרן לראיונות - קיבלתם משימת תכנות? קודם כל שיעבוד, ורק אח"כ תחשבו על שיפורים. </span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">איך מזהים אנטי-פטרן? כשהקוד מתחיל להסתבך, משהו פה לא מריח טוב.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">לא לבצע </span><a href="http://en.wikipedia.org/wiki/Code_review" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Code Reviews</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">עצי ירושה גדולים שהופכים ליער - אולי כדאי לעבור להכלה במקום ירושה.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">אנטי-פטרנס חמים מהתנור של איתי: לא לשלוט בAPI של השפה &nbsp;(Vector.java מישהו?) וקבועים שרירותיים בקוד.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">לסיום, מור"קים מ Orbitz: מסטר JIRA.</span></div>
</li>
</ul>
<div dir="rtl" style="text-align: right;">
<b id="docs-internal-guid-1f1d89c7-62c7-e72e-1e38-8b1947f65f8e" style="font-weight: normal;"><br><span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"></span></b></div>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">24-25 בפבר', </span><a href="http://summit2014.reversim.com/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Reversim Summit 2014!!</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"></span></div>
</li>
</ul>
<div dir="rtl" style="text-align: right;">
<br><span style="font-family: Arial; font-size: 15px; vertical-align: baseline; white-space: pre-wrap;"></span></div>
<div dir="rtl" style="text-align: right;">
הקובץ נמצא <a href="http://m.reversim.com/reversim195_finalclass34_anti-patterns.mp3">כאן</a>
האזנה נעימה
ותודה רבה לאורן אפרתי על התמלול!</div>
</div>
<div style="clear: both;"></div>
</div>
