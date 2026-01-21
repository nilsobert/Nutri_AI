#import "@preview/elsearticle:1.1.1": *

// https://typst.app/docs/guides/for-latex-users/

#show: elsearticle.with(
  title: "Project Safety and Reflection Report",
  authors: (
    (
      name: "Laura Kotalczyk"
      
    ),
    (
      name: "Manuel Mühlberger",
    ),
  ),
  format: "3p",
  numcol: 2,
  // line-numbering: true,
)

= Safety of GenAI
#set par(
  first-line-indent: 1em,
  spacing: 0.65em,
  justify: true,
)
== Identified Risks
With the current setup of our service, we see two distinct areas bearing potential risks, namely, data privacy and security. The following paragraphs discuss these aspects in more detail.

=== Data Privacy Concerns
#set par(
  first-line-indent: 1em,
  spacing: 0.65em,
  justify: true,
)
Since user data is a key asset of our service, data privacy, in particular, GDPR regulations are corner stones of our risk management.

=== Security Concerns
Since our service builds on a server-client architecture and uses an API to call the Vision Language Model (VLM) for meal nutrient estimation, our application
is inherently vulnerable against malicious attacks, such as DDoS attacks or rate limit exceeding. 
As our service uses credit-based API calls to the VLM for meal logging, rate limit exceeding would not only result in availability problems, but also cause financial damage, if not properly handled. 

== Risk Mitigations

- output guardrails
- data privacy: "self-hosted" stuff, proxy, authentication, rate-limiting -> ddos, money abuse

=== Data Privacy Concerns
#set par(
  first-line-indent: 1em,
  spacing: 0.65em,
  justify: true,
)

=== Security Concerns
To mitigate potential attack vectors concerning service availability, several mechanisms were implemented.

#set par(
  first-line-indent: 1em,
  spacing: 0.65em,
  justify: true,
)
First of all, we established a user authentication mechanism based on JSON Web Tokens (JWT) and certificates, making sure only authenticated users could interact with our service, i.e. send requests to the VLM for meal nutrient estimation. This approach prevents direct public access to the VLM request endpoint, leveraging the server as a secure gateway for authenticated requests. A per-user rate limit - currently five requests daily - has been integrated into the development phase. This limit can easily be modified when the service is deployed to production.


= Lessons Learned and Reflections

== Team and Project Management
- aligning expectations
- team management
- architecture was hard 
- AIs as black boxes, simpler prompts sometimes work better but there are multiple stellschrauben you can use to improve model results
- Prompting and data is very important, if your data is biased, incomplete, ambigiuous you cannot evaluate a model's performance properly
- integrating GenAi into a consumer app involves lots of data privacy and security concerns

== Architectural Design

== Insights on GenAI and its Applications

...
Our findings challenged the assumption that complexity yields superior results, demonstrating that simpler methods often outperform more complex ones in practical scenarios. We observed that high benchmark scores are not always indicative of real-world performance, as the effectiveness of GenAI is heavily context-dependent. Consequently, achieving the optimal configuration requires a systematic, experimental approach, adjusting prompts and parameters to identify the most impactful variables. While established techniques provide a foundation for improvement, the 'black-box' nature of AI as well as the large number of models, and corresponding set screws, makes this a tedious and time-consuming process, requiring significant iteration to reach high-quality results.

-Detail what worked well and what could be improved in future projects.
Reflect on insights gained and how this project has influenced your understanding of
GenAI and its applications

= Acknowledgments of GenAI Usage
#set par(
  first-line-indent: 1em,
  spacing: 0.65em,
  justify: true,
)

Generative AI was used in the process of writing this document in terms of improving the vocabulary used.

$
y = alpha x + beta tau integral_0^x d x
$ <eq1>
where ...

$
  x = integral_0^x d x #<eqa>\
  (u v)' = u' v + v' u #<eqb>
$ <eq2>

Eq. @eqa is a simple integral, while Eq. @eqb is the derivative of a product of two functions. These equations are grouped in Eq. @eq2.

== Features

=== Table

Below is Table @tab:tab1.

#let tab1 = {
  table(
  columns: 3,
  table.header(
    [*Header 1*],
    [*Header 2*],
    [*Header 3*],
  ),
  [Row 1], [12.0], [92.1],
  [Row 2], [16.6], [104],
)
}

#figure(
    tab1,
    kind: table,
    caption : [Example]
) <tab:tab1>

=== Figures

Below is Fig. @fig:logo.

#figure(
  image("images/typst-logo.svg", width: 50%),
  caption : [Typst logo - Credit: \@fenjalien]
) <fig:logo>

=== Subfigures

Below are Figs. @figa and @figb, which are part of Fig. @fig:typst.

#subfigure(
figure(image("images/typst-logo.svg"), caption: []), <figa>,
figure(image("images/typst-logo.svg"), caption: []), <figb>,
columns: (1fr, 1fr),
caption: [(a) Left image and (b) Right image],
label: <fig:typst>,
)

#show: appendix

= Appendix A

== Figures

In @fig:app

#figure(
  image("images/typst-logo.svg", width: 50%),
  caption : [Books cover]
) <fig:app>

== Subfigures

Below are @figa-app and @figb-app, which are part of @fig:typst-app.

#subfigure(
figure(image("images/typst-logo.svg"), caption: []), <figa-app>,
figure(image("images/typst-logo.svg"), caption: []), <figb-app>,
columns: (1fr, 1fr),
caption: [(a) Left image and (b) Right image],
label: <fig:typst-app>,
)

== Tables

In @tab:app

#figure(
    tab1,
    kind: table,
    caption : [Example]
) <tab:app>

== Equations

In @eq

$
y = f(x)
$ <eq>

#nonumeq[$
    y = g(x)
    $
]

$
y = f(x) \
y = g(x)
$

#bibliography("refs.bib")