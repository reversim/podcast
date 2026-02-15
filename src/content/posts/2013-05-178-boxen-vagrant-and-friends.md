---
title: 178 Boxen, Vagrant and friends
date: 2013-05-02T19:15:00.000Z
tags:
  - devops
  - vagrant
episode: 178
audio_url: https://m.reversim.com/reversim178_boxen_vagrant_and_friends.mp3
cover_image: /images/blogger/f70dd69349848dfe0111.jpg
legacy_url: https://www.reversim.com/2013/05/178-boxen-vagrant-and-friends.html
legacy_path: /2013/05/178-boxen-vagrant-and-friends
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="rtl" style="text-align: right;">
<a href="http://garbagedayreviews.files.wordpress.com/2011/09/modern-times-2.jpg" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" height="150" src="/podcast/images/blogger/f70dd69349848dfe0111.jpg" width="200"></a><b id="docs-internal-guid-752bbfd7-66aa-3d25-9d04-190a0ecdf78e" style="font-weight: normal; text-align: start;"></b></div>
<div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<b id="docs-internal-guid-752bbfd7-66aa-3d25-9d04-190a0ecdf78e" style="font-weight: normal; text-align: start;"><span style="font-family: Arial; font-size: 15px; vertical-align: baseline; white-space: pre-wrap;">יש מי </span><a href="//www.youtube.com/watch?v=9X_ViIPA-Gc" style="text-decoration: none;"><span style="color: #1155cc; font-family: Arial; font-size: 15px; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">שיעשה הכול בשביל אהבה</span></a><span style="font-family: Arial; font-size: 15px; vertical-align: baseline; white-space: pre-wrap;">, </span><a href="http://boxen.github.com/" style="text-decoration: none;"><span style="color: #1155cc; font-family: Arial; font-size: 15px; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Boxen</span></a><span style="font-family: Arial; font-size: 15px; vertical-align: baseline; white-space: pre-wrap;"> יעשה הכול בשביל אוטומציה מלאה של התקנת תחנת העבודה שלכם.</span></b></div>
<div dir="rtl" style="text-align: right;">
<b id="docs-internal-guid-752bbfd7-66aa-3d25-9d04-190a0ecdf78e" style="font-weight: normal; text-align: start;"><i style="font-style: normal;"></i></b></div>
<ul dir="rtl" style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;"><b id="docs-internal-guid-752bbfd7-66aa-3d25-9d04-190a0ecdf78e" style="font-weight: normal; text-align: start;"><i style="font-style: normal;">
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<a href="//www.youtube.com/watch?v=6esPMfxaqVQ&amp;feature=youtu.be" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">שומרים בגאון</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> על צלם אנוש בתוך ים של מכונות אוטומטיות - </span><a href="http://www.linkedin.com/in/lharel" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">ליאור הראל</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> ו</span><a href="http://www.information-facts.com/wp-content/uploads/slash-12-17-081.jpg" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">רן תבורי</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">.</span></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<span style="vertical-align: baseline; white-space: pre-wrap;">ליאור ארכיטקט בחברת </span><a href="http://www.kenshoo.com/" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Kenshoo</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">, חברה ישראלית בת 7 שנים, עוזרת לחברות לנהל </span><a href="http://en.wikipedia.org/wiki/Search_engine_marketing" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">SEM</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">, פוזל לכיוון ה-DevOps (שם אין Java. הללויה.)</span></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<span style="vertical-align: baseline; white-space: pre-wrap;">Boxen הוא כלי תוצרת GitHub, מטרתו בחיים - להתקין ולקנפג תחנת עבודה.</span></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<span style="vertical-align: baseline; white-space: pre-wrap;">קפה, סיגריה - והמחשב שלך מוכן. אמריקה.</span></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<span style="vertical-align: baseline; white-space: pre-wrap;">Boxen - רק על מק, רק על הגרסה האחרונה. אחלה גמישות.</span></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<span style="vertical-align: baseline; white-space: pre-wrap;">ב-Kenshoo פיתחו פיתרון דומה ל-Boxen בשביל אובונטו, מבוסס Puppet.</span></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<span style="vertical-align: baseline; white-space: pre-wrap;">בשביל ההתחלה (ורק בשבילה!) אפשר להשתמש בכמה סקריפטים פשוטים.</span></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<span style="vertical-align: baseline; white-space: pre-wrap;">אין אובונטו, אין אוטומציה (על ווינדוס אין על מה לדבר)</span></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<span style="vertical-align: baseline; white-space: pre-wrap;">ומה עם מי שכבר יש לו מכונה שעובדת? בעיה.</span></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<a href="http://www.vagrantup.com/" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Vagrant</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> - אוטומטי, ווירטואלי, קומנדלייני, הולך טוב עם Puppet ו-Chef. להגיש קר.</span></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<span style="vertical-align: baseline; white-space: pre-wrap;">מעניין איך נעשו הבדיקות ל-Boxen. באמת, מעניין...</span></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<span style="vertical-align: baseline; white-space: pre-wrap;">הפערים החברתיים בארץ נובעים ממחירם הגבוה של מוצרי אפל. זה מדעי.</span></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<span style="vertical-align: baseline; white-space: pre-wrap;">גם אינטגרציה עושים עם Vagrant. הכול אפשר לעשות עם הדבר הזה.</span></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<span style="vertical-align: baseline; white-space: pre-wrap;">אפשר גם להרים מכונות בענן (אמאזון, VMWare וכו') דרך פקודות ב-CLI.</span></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<span style="vertical-align: baseline; white-space: pre-wrap;">שפה דינמית? תבדוק, תבדוק הכול. כולל הכול.</span></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<span style="vertical-align: baseline; white-space: pre-wrap;">Kenshoo משתמשים ב-GitHub בשביל SCM. כן, ככה עברו, ביום אחד.</span></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<span style="vertical-align: baseline; white-space: pre-wrap;">ב-Git יש </span><a href="http://nvie.com/posts/a-successful-git-branching-model/" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">דרך לעבוד נכון</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> <a href="http://scottchacon.com/2011/08/31/github-flow.html">וגם GitHubֿ</a>, עם  </span><a href="https://github.com/blog/1375-task-lists-in-gfm-issues-pulls-comments" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Pull requests</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">.</span></div>
<div>
<span style="vertical-align: baseline; white-space: pre-wrap;"><br></span></div>
</li>
</i></b></ul>
<div dir="rtl" style="text-align: right;">
<b id="docs-internal-guid-752bbfd7-66aa-3d25-9d04-190a0ecdf78e" style="font-weight: normal; text-align: start;"><i style="font-style: normal;">
</i></b></div>
<div dir="rtl" style="text-align: right;">
</div>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="text-align: right;">
הקובץ נמצא <a href="http://m.reversim.com/reversim178_boxen_vagrant_and_friends.mp3">כאן</a>
האזנה נעימה
ותודה רבה ליותם אורון על התמלול!</div>
</div>
<div style="clear: both;"></div>
</div>
