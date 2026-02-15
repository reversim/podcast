---
title: 255 Fogcast 18 - Windows Deployment
date: 2015-04-14T07:45:00.000Z
tags:
  - fogcast
episode: 255
audio_url: https://m.reversim.com/reversim255_fogcast18-win-deployment.mp3
cover_image: /images/blogger/b8a3d7644c0b5758541b.png
legacy_url: https://www.reversim.com/2015/04/255-fogcast-18-windows-deployment.html
legacy_path: /2015/04/255-fogcast-18-windows-deployment
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="rtl" style="line-height: 1.7999999999999998; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">כוסות עבור הערות - והשבוע אור אלימלך זוכה ומקבל את המאג.</span></div>
<div dir="rtl" style="line-height: 1.7999999999999998; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">אור </span><a href="https://disqus.com/home/discussion/reversim/253_fogcast_17_deployments/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">הזכיר</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> את הכלי </span><a href="https://www.terraform.io/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Terraform</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> - כלי לקונפיגורציה ודפלוימנט "בין ענני", גם אמזון וגם אחרים.</span></div>
<div dir="rtl" style="line-height: 1.7999999999999998; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"><br></span></div>
<div class="separator" style="clear: both; text-align: center;">
<a href="/podcast/images/blogger/b8a3d7644c0b5758541b.png" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" height="148" src="/podcast/images/blogger/b8a3d7644c0b5758541b.png" width="200"></a></div>
<div dir="rtl" style="line-height: 1.7999999999999998; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"><br></span></div>
<div dir="rtl" style="line-height: 1.7999999999999998; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">איתי עובד בחברת </span><a href="http://sarine.com/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Sarine</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> ובא אלינו לדבר על הפצה - דפלוימנט בעולם של Windows.</span></div>
<div dir="rtl" style="text-align: right;">
<b id="docs-internal-guid-5aece7cd-b6dd-7e6f-cead-e6caa19fa7e5" style="font-weight: normal;"><br></b></div>
<ul style="margin-bottom: 0pt; margin-top: 0pt;">
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.7999999999999998; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<a href="https://www.visualstudio.com/en-us/explore/release-management-vs.aspx" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Release Management</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> כלי הפצה של מיקרוסופט בתוך סביבת Visual-Studio.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.7999999999999998; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">איתי הזכיר את ההפצה </span><a href="http://beanstalkapp.com/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Beanstalk</span></a></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.7999999999999998; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">הפצה של סביבת הרצה כולל מערכת הפעלה לעומת תוכנה בלבד.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.7999999999999998; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">יתרונות וחסרונות להפצה מלאה בכל פעם.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.7999999999999998; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">עדכוני מערכת הפעלה, עדכניות ובדיקות.</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.7999999999999998; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">השלב הבא </span><a href="https://www.google.co.il/url?sa=t&amp;rct=j&amp;q=&amp;esrc=s&amp;source=web&amp;cd=1&amp;cad=rja&amp;uact=8&amp;sqi=2&amp;ved=0CCkQFjAA&amp;url=http%3A%2F%2Fwww.asp.net%2Fvnext&amp;ei=wIEpVeL7GYnqUt-Mg5gJ&amp;usg=AFQjCNFVfvljguujA5aed9lkxY0NKCw_VQ&amp;sig2=XmTGmA8oUWvHV2ptTj8PxA&amp;bvm=bv.90491159,d.d2s" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">VNext</span></a></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.7999999999999998; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">ווינדוס מעל אמזון</span></div>
</li>
<li dir="rtl" style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; list-style-type: disc; text-decoration: none; vertical-align: baseline;"><div dir="rtl" style="line-height: 1.7999999999999998; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">מה עם </span><a href="http://blogs.msdn.com/b/webdev/archive/2015/01/14/running-asp-net-5-applications-in-linux-containers-with-docker.aspx" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Docker</span></a><span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">?</span></div>
</li>
</ul>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="line-height: 1.7999999999999998; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<a href="http://sarine.com/about-us/career/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: bold; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">בסרין מגייסים מהנדסי תוכנה במגוון משרות</span></a></div>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="text-align: right;">
הקובץ נמצא <a href="http://m.reversim.com/reversim255_fogcast18-win-deployment.mp3">כאן</a>, האזנה נעימה ותודה רבה ליוסי על התמלול</div>
</div>
<div style="clear: both;"></div>
</div>
