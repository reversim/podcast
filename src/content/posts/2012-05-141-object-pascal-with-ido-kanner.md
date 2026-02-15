---
title: 141 Object Pascal with Ido Kanner
date: 2012-05-28T20:13:00.000Z
episode: 141
audio_url: https://m.reversim.com/reversim141_obj_pascal.mp3
cover_image: /images/blogger/31cdb833be5d757c5588.png
legacy_url: https://www.reversim.com/2012/05/141-object-pascal-with-ido-kanner.html
legacy_path: /2012/05/141-object-pascal-with-ido-kanner
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="rtl" style="text-align: right;">
<b id="internal-source-marker_0.5922525469213724" style="text-align: -webkit-auto;"></b></div>
<ul dir="rtl" style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div class="separator" style="clear: both; text-align: center;">
<a href="/images/blogger/81625d7a5c21daa2ac9f.png" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" height="59" src="/images/blogger/31cdb833be5d757c5588.png" width="320"></a></div>
<div style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span id="internal-source-marker_0.5922525469213724" style="text-align: -webkit-auto;"><span style="vertical-align: baseline; white-space: pre-wrap;">אני מתכבד לפתוח בזאת את הכנס השמיני בנושא "אובייקטיביות ותכנות" של המחלקה לפילוסופיה. איתנו בפאנל פרופסור אורי להב ("האובייקט ואני", הוצאת מידן), דוקטור רן תבורי ("אובייקטיבי-סובייקטיבי: גילוי עצמי דרך תכנות מונחה עצמים", הוצאת עם עובד), ואורח הכבוד פרופסור אמריטוס </span><a href="http://idkn.wordpress.com/"><span style="color: #1155cc; vertical-align: baseline; white-space: pre-wrap;">עידו קנר</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> ("כשסטרוסטרופ בכה: מסע לנבכי המחלקה", הוצאת זמורה-ביתן). באג'נדה היום: </span><a href="http://freepascal.org/"><span style="color: #1155cc; vertical-align: baseline; white-space: pre-wrap;">Free Pascal</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"></span></span></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span id="internal-source-marker_0.5922525469213724" style="text-align: -webkit-auto;"><span style="vertical-align: baseline; white-space: pre-wrap;">עידו עצמאי, מתעסק ב-VoIP, </span><a href="http://www.asterisk.org.il/"><span style="color: #1155cc; vertical-align: baseline; white-space: pre-wrap;">Asterisk</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">.</span></span></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span id="internal-source-marker_0.5922525469213724" style="text-align: -webkit-auto;"><span style="vertical-align: baseline; white-space: pre-wrap;">תורם גם ל-</span><a href="http://freepascal.org/"><span style="color: #1155cc; vertical-align: baseline; white-space: pre-wrap;">Free Pascal Compiler</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">, סביבת פיתוח (IDE) בשם </span><a href="http://lazarus.freepascal.org/"><span style="color: #1155cc; vertical-align: baseline; white-space: pre-wrap;">Lazarus</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> ואוהב קוד פתוח. אנחנו כבר אוהבים אותו.</span></span></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span id="internal-source-marker_0.5922525469213724" style="text-align: -webkit-auto;"><span style="vertical-align: baseline; white-space: pre-wrap;">Delphi הוא ווריאנט של Object Pascal וכך גם Free Pascal. </span><a href="http://en.wikipedia.org/wiki/Borland"><span style="color: #1155cc; vertical-align: baseline; white-space: pre-wrap;">בורלנד</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> טבעו את המושג. דקת דומייה לזכר המתים.</span></span></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span id="internal-source-marker_0.5922525469213724" style="text-align: -webkit-auto;"><span style="vertical-align: baseline; white-space: pre-wrap;">ישנם כמה תקנים של Pascal, אחד מהם של Apple. מי היה מאמין. הם אפילו השתמשו בשפה בשביל לכתוב את מערכת ההפעלה שלהם באותה תקופה.</span></span></div>
</li>
<li style="list-style-type: disc; vertical-align: baseline;"><div style="margin-bottom: 0pt; margin-top: 0pt;">
<span id="internal-source-marker_0.5922525469213724" style="font-family: Arial; font-size: 15px; text-align: -webkit-auto;"><span style="vertical-align: baseline; white-space: pre-wrap;">עידו כותב </span><a href="https://github.com/ik5/redis_client.fpc"><span style="color: #1155cc; vertical-align: baseline; white-space: pre-wrap;">קליינט לרדיס בפסקל</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">. </span><span style="color: #1155cc; vertical-align: baseline; white-space: pre-wrap;"><a href="http://whatsup.org.il/modules.php?op=modload&amp;name=News&amp;file=article&amp;sid=6998">יש גם מפגש</a></span><span style="vertical-align: baseline;"></span></span>, ממש בקרוב, יום ד הזה (30.5.2012)</div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span id="internal-source-marker_0.5922525469213724" style="text-align: -webkit-auto;"><span style="vertical-align: baseline; white-space: pre-wrap;">שם, בין C ל-++C, שם בדיוק תמצאו את פסקל.</span></span></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span id="internal-source-marker_0.5922525469213724" style="text-align: -webkit-auto;"><span style="vertical-align: baseline; white-space: pre-wrap;">הקומפיילר של פסקל יודע להסיק מתוך הקוד מה הוא צריך לעשות.</span></span></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span id="internal-source-marker_0.5922525469213724" style="text-align: -webkit-auto;"><span style="vertical-align: baseline; white-space: pre-wrap;">בפסקל כדאי להשתמש כאשר המשימה היא יותר High Level</span></span></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span id="internal-source-marker_0.5922525469213724" style="text-align: -webkit-auto;"><span style="vertical-align: baseline; white-space: pre-wrap;">לפסקל יש גם </span><a href="http://www.objectivepascal.com/"><span style="color: #1155cc; vertical-align: baseline; white-space: pre-wrap;">Objective Pascal</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> שיודע לדבר עם Objective C (אותו </span><a href="http://en.wikipedia.org/wiki/Application_binary_interface"><span style="color: #1155cc; vertical-align: baseline; white-space: pre-wrap;">ABI</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">)</span></span></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span id="internal-source-marker_0.5922525469213724" style="text-align: -webkit-auto;"><span style="vertical-align: baseline; white-space: pre-wrap;">בגרסאות האחרונות של Free Pascal אפשר לקמפל את הקוד כך שירוץ על ה-JVM (כמה בדיחות של אורי ורן באות פה).</span></span></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span id="internal-source-marker_0.5922525469213724" style="text-align: -webkit-auto;"><span style="vertical-align: baseline; white-space: pre-wrap;">לרוב החברות הגדולות יש Delphi בארגון (שזה בעצם אומר שיש להם Pascal בארגון)</span></span></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span id="internal-source-marker_0.5922525469213724" style="text-align: -webkit-auto;"><span style="vertical-align: baseline; white-space: pre-wrap;">מפתחי iOS שלא רצו ++C, C או Objective C הלכו ל-Pascal</span></span></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span id="internal-source-marker_0.5922525469213724" style="text-align: -webkit-auto;"><span style="vertical-align: baseline; white-space: pre-wrap;">אפשר גם לפתח ל-ווב ב-Pascal</span></span></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span id="internal-source-marker_0.5922525469213724" style="text-align: -webkit-auto;"><a href="http://august.penguin.org.il/"><span style="color: #1155cc; vertical-align: baseline; white-space: pre-wrap;">כנס התוכנה החופשית</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> בישראל בשיתוף עם </span><a href="http://www.hamakor.org.il/"><span style="color: #1155cc; vertical-align: baseline; white-space: pre-wrap;">עמותת הקוד הפתוח בישראל</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">. תבואו.</span></span></div>
</li>
<li style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span id="internal-source-marker_0.5922525469213724" style="text-align: -webkit-auto;"><span style="vertical-align: baseline; white-space: pre-wrap;">ה-</span><a href="http://www.iltt.org.il/home/techtalks-week-2012"><span style="color: #1155cc; vertical-align: baseline; white-space: pre-wrap;">ILTechTalks week</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> יוצא לדרך זו השנה השניה. Outbrain מארחת.</span></span></div>
<div style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span id="internal-source-marker_0.5922525469213724" style="text-align: -webkit-auto;"><span style="vertical-align: baseline; white-space: pre-wrap;"><br></span></span></div>
</li>
</ul>
<div dir="rtl" style="text-align: right;">
</div>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="text-align: right;">
הקובץ נמצא <a href="http://m.reversim.com/reversim141_obj_pascal.mp3">כאן</a>
האזנה נעימה</div>
<div dir="rtl" style="text-align: right;">
תודה רבה ליותם אורון על עבודה התמלול הנאמנה!</div>
</div>
<div style="clear: both;"></div>
</div>
