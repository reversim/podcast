---
title: "Summit 2018: Going Full Rewrite - The Incremental Way / Alex Badyan"
date: 2018-11-25T18:36:00.000Z
tags:
  - summit
audio_url: http://m2.reversim.com/summit2018-Alex_Badyan.mp3
legacy_url: https://www.reversim.com/2018/11/summit-2018-going-full-rewrite.html
legacy_path: /2018/11/summit-2018-going-full-rewrite
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="ltr" style="text-align: left;" trbidi="on">
After coming to the realization that our backend system cannot scale for much longer and that new features are very difficult to add, we decided to write it from scratch.<br>
With hundreds of thousands of users actively engaging our system, we don’t have the privilege to start over and grow slowly.<br>
We rewrote the applicative layers while still relying on the old data store and then wrote a new db and app stack layer, replacing the legacy one piece by piece.<br>
We implemented a migration system that is always on, meaning that every change in the old system makes its way to the new system, making the two systems eventually equivalent.<br>
I will discuss the challenges and lessons learned.</div>
<br>
<iframe allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen="" frameborder="0" height="315" src="https://www.youtube-nocookie.com/embed/TK_u496ZE4Q" width="560"></iframe><br>
<br>
<a href="http://m2.reversim.com/summit2018-Alex_Badyan.mp3">MP3</a>
</div>
<div style="clear: both;"></div>
</div>
