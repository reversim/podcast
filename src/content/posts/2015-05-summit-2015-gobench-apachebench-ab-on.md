---
title: "Summit 2015: gobench :: ApacheBench (ab) on steroids / Uri Shamay"
date: 2015-05-02T20:18:00.000Z
tags:
  - summit
audio_url: http://m.reversim.com/summit2015_open_source_1_Uri_Shamay.mp3
legacy_url: https://www.reversim.com/2015/05/summit-2015-gobench-apachebench-ab-on.html
legacy_path: /2015/05/summit-2015-gobench-apachebench-ab-on
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="ltr" style="text-align: left;" trbidi="on">
There are many tools to massively stress-test your HTTP/HTTPS service without using hundreds of Amazon EC2 machines (JMeter is not one of them):<br>
<br>
ab, siege, weighttp, httperf, wrk<br>
<br>
All those tools are written with scalability in mind to support "unlimited" connections with just a few OS native threads. To support that scalabilty, those tools are written in an event model with callback hell in C/C++. Unfortunately, if you need to customize the tools with some specific modification for your service, or just hook the flow for more trace-ability, you are totally screwed because of C/C++ spaghetti code. Also, you need to spent a few hours at stackoverflow.com to successfully compile those changes using complex build tools.<br>
<br>
In this session I will talk about an open source tool that I wrote: gobench (<a href="https://github.com/cmpxchg16/gobench">https://github.com/cmpxchg16/gobench</a>). This tool gives you the same performance as those hardcore tools thanks to Go (golang), and the ability to modify the code and compile it while still staying sane. This is available thanks to Go and the concurrency simplification it offers, and to a single command to compile a single big statically binary with no dependencies, that will work on any Linux distro! YEAH!<br>
<br></div>
<iframe allowfullscreen="" frameborder="0" height="315" src="https://www.youtube-nocookie.com/embed/QJ7NBPU-RuA?rel=0&amp;showinfo=0" width="560"></iframe><br>
<br>
<a href="http://m.reversim.com/summit2015_open_source_1_Uri_Shamay.mp3">MP3</a></div>
<div style="clear: both;"></div>
</div>
