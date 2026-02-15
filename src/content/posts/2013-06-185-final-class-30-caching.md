---
title: 185 final class 30 caching
date: 2013-06-17T20:44:00.000Z
tags:
  - cache
  - finalclass
episode: 185
audio_url: https://m.reversim.com/reversim185_final_class_30_caching.mp3
cover_image: https://lh3.googleusercontent.com/blogger_img_proxy/AEn0k_ta-vbRI2s9zDkhMvSaeHt2SURokLGijmR_dr3iXyKVvQAedxa_QJhLAjq3SVTELIJai5hBzmYoDDeRa8A1bYDAbyV4HbfLCed4modCh5r7qw=s0-d
legacy_url: https://www.reversim.com/2013/06/185-final-class-30-caching.html
legacy_path: /2013/06/185-final-class-30-caching
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<b id="docs-internal-guid-1e493a26-53df-f0ee-31e2-8c2da3855ce9" style="font-weight: normal;"></b><br>
<div dir="ltr" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt;">
<b id="docs-internal-guid-1e493a26-53df-f0ee-31e2-8c2da3855ce9" style="font-weight: normal;"><a href="http://www.pjfarmer.com/bimages/cache1tor.jpg" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" height="200" src="https://lh3.googleusercontent.com/blogger_img_proxy/AEn0k_ta-vbRI2s9zDkhMvSaeHt2SURokLGijmR_dr3iXyKVvQAedxa_QJhLAjq3SVTELIJai5hBzmYoDDeRa8A1bYDAbyV4HbfLCed4modCh5r7qw=s0-d" width="120"></a><span style="font-family: Arial; font-size: 15px; vertical-align: baseline; white-space: pre-wrap;">“</span><span style="background-color: white; color: #333333; font-family: Arial; font-size: 13px; vertical-align: baseline; white-space: pre-wrap;">Don't say a prayer for me now, Save it 'til the morning after” - </span><a href="http://he.wikipedia.org/wiki/%D7%93%D7%95%D7%A8%D7%90%D7%9F_%D7%93%D7%95%D7%A8%D7%90%D7%9F" style="text-decoration: none;"><span style="background-color: white; color: #1155cc; font-family: Arial; font-size: 13px; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Duran Duran</span></a><span style="background-color: white; color: #333333; font-family: Arial; font-size: 13px; vertical-align: baseline; white-space: pre-wrap;">, </span><a href="//www.youtube.com/watch?v=pqHYr592HOY" style="text-decoration: none;"><span style="background-color: white; color: #1155cc; font-family: Arial; font-size: 13px; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Save a prayer</span></a><span style="background-color: white; color: #333333; font-family: Arial; font-size: 13px; vertical-align: baseline; white-space: pre-wrap;"></span></b></div>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<b id="docs-internal-guid-1e493a26-53df-f0ee-31e2-8c2da3855ce9" style="font-weight: normal;"><a href="//www.youtube.com/watch?v=gxsnXuJbH3g&amp;feature=youtu.be" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">שומרים טוב-טוב בלב</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> (אבל רק עד שמשהו יותר חשוב יגיע) - </span><a href="http://lolshout.com/wp-content/uploads/2012/09/funny-birds-real-angry-bird.jpg" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">ישי "השקט", גילי "המביט", איתי "מישיר המבט" ורן "המארגן"</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">. הנושא שמור בתוך כספת - Caching.</span></b></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<b id="docs-internal-guid-1e493a26-53df-f0ee-31e2-8c2da3855ce9" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">יבגני ודמיטרי </span><a href="http://www.reversim.com/2013/04/summit-2013-i-want-to-cache-it-now-by.html" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">נתנו בראש</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> בכנס רברסים בנושא Cache - שווה צפיה.</span></b></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<b id="docs-internal-guid-1e493a26-53df-f0ee-31e2-8c2da3855ce9" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">Caching אפשר לעשות בכל מיני רמות, בכל מיני מקומות, לכל מיני דברים.</span></b></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<b id="docs-internal-guid-1e493a26-53df-f0ee-31e2-8c2da3855ce9" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">בדרך כלל, מה שמשתמשים בו יותר נשאר בזיכרון.</span></b></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<b id="docs-internal-guid-1e493a26-53df-f0ee-31e2-8c2da3855ce9" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">החישוב יקר וכך גם הרשת - אלה הם אזורים מועדפים ל-Caching</span></b></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<b id="docs-internal-guid-1e493a26-53df-f0ee-31e2-8c2da3855ce9" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">בשפות עם GC, ככל שיש יותר אובייקטים בזיכרון, ככה ה-GC יטחן (אאוצ'!).</span></b></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<b id="docs-internal-guid-1e493a26-53df-f0ee-31e2-8c2da3855ce9" style="font-weight: normal;"><a href="http://en.wikipedia.org/wiki/Cache_invalidation" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Cache invalidation</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> - קשה, קשה...</span></b></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<b id="docs-internal-guid-1e493a26-53df-f0ee-31e2-8c2da3855ce9" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">גם Client side caching - קשה, קשה...</span></b></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<b id="docs-internal-guid-1e493a26-53df-f0ee-31e2-8c2da3855ce9" style="font-weight: normal;"><a href="http://memcached.org/" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Memcached</span></a><span style="vertical-align: baseline; white-space: pre-wrap;"> - סופר-דופר קאש. שווה.</span></b></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<b id="docs-internal-guid-1e493a26-53df-f0ee-31e2-8c2da3855ce9" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">תביא לי את הקובץ - אבל רק אם משהו השתנה.</span></b></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<b id="docs-internal-guid-1e493a26-53df-f0ee-31e2-8c2da3855ce9" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">כבר בכיתה ב' אנחנו עושים Caching ללוח הכפל. בהמשך, בתנאי שאתם תלמידים טובים וממושמעים, אתם עושים Caching לכל מה שאתם לומדים ויוצאים מבית הספר עם ידע שהוא כבר 4 שנים אחרי ה-Expiry של ה-TTL שלו.</span></b></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<b id="docs-internal-guid-1e493a26-53df-f0ee-31e2-8c2da3855ce9" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">ומה עם המפתחות? מה ההתפלגות שלהם?</span></b></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<b id="docs-internal-guid-1e493a26-53df-f0ee-31e2-8c2da3855ce9" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">כמו בעוד תחומים בחיים, אם ה-Cache שלך מפספס יותר מדי פעמים - אתה עושה משהו לא נכון.</span></b></div>
</li>
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<b id="docs-internal-guid-1e493a26-53df-f0ee-31e2-8c2da3855ce9" style="font-weight: normal;"><span style="vertical-align: baseline; white-space: pre-wrap;">במנועי החיפוש הגדולים היום (גוגל ו-בינג), </span><a href="http://cdn.dejanseo.com.au/wp-content/uploads/2012/04/Indexing-The-World-Wide-Web-The-Journey-So-Far.pdf" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">רוב השאילתות מאוחסנות ב-Cache</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">.</span></b></div>
</li>
</ul>
<b id="docs-internal-guid-1e493a26-53df-f0ee-31e2-8c2da3855ce9" style="font-weight: normal;"><br><span style="font-family: Arial; font-size: 15px; vertical-align: baseline; white-space: pre-wrap;"></span><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="font-family: Arial; font-size: 15px; vertical-align: baseline; white-space: pre-wrap;">אירועים:</span></div>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="font-family: Arial; font-size: 15px; list-style-type: disc; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="vertical-align: baseline; white-space: pre-wrap;">DevOpsDays בישראל. יש לכם משהו חכם להגיד? </span><a href="http://devopsdays.org/events/2013-telaviv/propose/" style="text-decoration: none;"><span style="color: #1155cc; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">אנחנו רוצים לשמוע</span></a><span style="vertical-align: baseline; white-space: pre-wrap;">. ואם אתם רוצים להיות ספונסרים - אז גם אפשר.</span></div>
</li>
</ul>
<br><span style="font-family: Arial; font-size: 15px; vertical-align: baseline; white-space: pre-wrap;"></span><div dir="rtl" style="line-height: 1.15; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="font-family: Arial; font-size: 15px; vertical-align: baseline; white-space: pre-wrap;">הקובץ נמצא </span><a href="http://m.reversim.com/reversim185_final_class_30_caching.mp3" style="text-decoration: none;"><span style="color: #1155cc; font-family: Arial; font-size: 15px; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">כאן</span></a><span style="font-family: Arial; font-size: 15px; vertical-align: baseline; white-space: pre-wrap;">, תודה ליותם אורון על התמלול.</span></div>
<div>
<span style="font-family: Arial; font-size: 15px; vertical-align: baseline; white-space: pre-wrap;"><br></span></div>
</b></div>
<div style="clear: both;"></div>
</div>
