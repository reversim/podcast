---
title: "Summit 2014: Open Source in Israel - Mordor / Uri Shamay"
date: 2014-04-28T19:41:00.000Z
tags:
  - summit
audio_url: https://m.reversim.com/reversim2014-oss-mordor.mp3
legacy_url: https://www.reversim.com/2014/04/summit-2014-open-source-in-israel_6896.html
legacy_path: /2014/04/summit-2014-open-source-in-israel_6896
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div style="background-color: rgba(255, 255, 255, 0.498039); box-sizing: border-box; color: #333333; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; margin-bottom: 10px; word-break: break-word;">
In this talk I will describe how we can write a high performance client / server in C++ with maximum utilization of SMP architecture on one end, and still maintain a very simple programming / troubleshooting code model with maximum productivity.<br style="box-sizing: border-box;">The solution is based on an open source library called Mordor, based on pseudo-synchronous model (asynchronous under the hood).</div>
<div style="background-color: rgba(255, 255, 255, 0.498039); box-sizing: border-box; color: #333333; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; margin-bottom: 10px; word-break: break-word;">
This model allows us to write Thread-like code (called Fibers, very similar to goroutines in GO), and still gain the asynchronous benefits. As a benchmark I will compare it to the naive approach of writing using the Callback code model, yielding non-maintainable code.</div>
<div style="background-color: rgba(255, 255, 255, 0.498039); box-sizing: border-box; color: #333333; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; margin-bottom: 10px; word-break: break-word;">
More information:</div>
<div style="background-color: rgba(255, 255, 255, 0.498039); box-sizing: border-box; color: #333333; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; margin-bottom: 10px; word-break: break-word;">
<a href="https://github.com/cmpxchg16/mordor" style="background-color: transparent; background-position: initial initial; background-repeat: initial initial; box-sizing: border-box; color: #428bca; text-decoration: none;">https://github.com/cmpxchg16/mordor</a></div>
<div style="background-color: rgba(255, 255, 255, 0.498039); box-sizing: border-box; color: #333333; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; margin-bottom: 10px; word-break: break-word;">
<a href="http://m.reversim.com/reversim2014-oss-mordor.mp3">MP3</a></div>
</div>
<div style="clear: both;"></div>
</div>
