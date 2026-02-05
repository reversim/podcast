---
title: "Summit 2014: Scaling out Datastores and the CAP Theorem / Yoav Abrahami"
date: 2014-04-27T18:56:00.000Z
tags:
  - summit
audio_url: http://m.reversim.com/reversim2014-CAP-theorem.mp3
legacy_url: https://www.reversim.com/2014/04/summit-2014-scaling-out-datastores-and.html
legacy_path: /2014/04/summit-2014-scaling-out-datastores-and
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div style="background-color: rgba(255, 255, 255, 0.498039); box-sizing: border-box; color: #333333; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; margin-bottom: 10px; word-break: break-word;">
Friday 4th June 1976, the Sex Pistols kicked off their first gig, a gig that's considered to change western music culture forever, pioneering the genesis of punk rock.</div>
<div style="background-color: rgba(255, 255, 255, 0.498039); box-sizing: border-box; color: #333333; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; margin-bottom: 10px; word-break: break-word;">
Wednesday 19th July 2000 had a similar impact on internet scale companies as the Sex Pistols did on music, with the keynote speech by Eric Brewer at the ACM symposium on the&nbsp;<a href="http://www.podc.org/podc2000/" style="background-color: transparent; background-position: initial initial; background-repeat: initial initial; box-sizing: border-box; color: #428bca; text-decoration: none;">Principles of Distributed Computing</a>&nbsp;(PODC). Eric Brewer claimed that as applications become more web-based we should stop worrying about data consistency, because if we want high availability in those new distributed applications, then we cannot have data consistency. Two years later, in 2002, Seth Gilbert and Nancy Lynch&nbsp;<a href="http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.20.1495&amp;rep=rep1&amp;type=pdf" style="background-color: transparent; background-position: initial initial; background-repeat: initial initial; box-sizing: border-box; color: #428bca; text-decoration: none;">formally proved</a>&nbsp;Brewer's claim as what is known today as the Brewer's Theorem or CAP.</div>
<div style="background-color: rgba(255, 255, 255, 0.498039); box-sizing: border-box; color: #333333; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; margin-bottom: 10px; word-break: break-word;">
The CAP theorem mandates that a distributed system cannot satisfy both Consistency, Availability and Partition tolerance. In the database ecosystem, many tools claim to solve our data persistence problems while scaling out, offering different capabilities (document stores, key/values, SQL, graph, etc).</div>
<div style="background-color: rgba(255, 255, 255, 0.498039); box-sizing: border-box; color: #333333; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; margin-bottom: 10px; word-break: break-word;">
In this talk we will explore the CAP theorem</div>
<ul style="background-color: rgba(255, 255, 255, 0.498039); box-sizing: border-box; color: #333333; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; margin-bottom: 10px; margin-top: 0px;">
<li style="box-sizing: border-box;">We will define what are Consistency, Availability and Partition Tolerance</li>
<li style="box-sizing: border-box;">We will explore what CAP means for our applications (ACID vs BASE)</li>
<li style="box-sizing: border-box;">We will explore practical applications on MySQL with read slave, MongoDB and Riak based on the work by&nbsp;<a href="http://aphyr.com/posts" style="background-color: transparent; background-position: initial initial; background-repeat: initial initial; box-sizing: border-box; color: #428bca; text-decoration: none;">Aphyr - Kyle Kingsbury</a>.</li>
</ul>
<div>
<span style="color: #333333; font-family: Helvetica Neue, Helvetica, Arial, sans-serif;"><span style="font-size: 14px; line-height: 20px;"><a href="http://m.reversim.com/reversim2014-CAP-theorem.mp3">MP3</a></span></span><br>
<span style="color: #333333; font-family: Helvetica Neue, Helvetica, Arial, sans-serif;"><br></span></div>
</div>
<iframe allowfullscreen="" frameborder="0" height="315" src="//www.youtube.com/embed/78PApLdvOQo?list=PLp33GadmS4eW5tlupTkS2uzSb024ig1iB" width="560"></iframe></div>
<div style="clear: both;"></div>
</div>
