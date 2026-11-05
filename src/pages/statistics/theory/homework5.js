// src/pages/statistics/theory/homework5.js
// La teoria dietro all'Homework #5 (la funzione di ripartizione della
// normale, le regole di quadratura e i loro errori, Gauss-Legendre, il limite
// infinito, la cancellazione nelle code, il metodo di Newton, il test di
// Kolmogorov-Smirnov, gli integrali di Riemann e di Lebesgue, Monte Carlo),
// la scaletta per presentarlo e le domande probabili, in inglese e in
// italiano. I numeri citati sono quelli della pagina dell'homework con i
// valori iniziali (seme 2026, 10.000 valori simulati, Monte Carlo con 1.000
// punti e 1.000 ripetizioni), che i calcoli con semi fissi ripetono sempre
// uguali.

const en = {
  intro: [
    'This page collects the theory behind Homework #5, so that it can be studied and explained at the desk: why the distribution function of the normal law has to be computed numerically, how quadrature rules work and how fast they converge, Gauss-Legendre, the infinite limit, the far tails and their cancellation, quantiles by Newton’s method, the Kolmogorov-Smirnov test, then the Riemann and the Lebesgue integral and Monte Carlo. Some of it repeats the homework page on purpose.',
    'Section 1 is the theory, section 2 an outline for presenting the homework in about five minutes, section 3 the questions the professor is likely to ask, with short answers to say aloud. The answers stay closed: try to answer first, then open them. The numbers quoted are those of the homework page with its initial values: seed 2026, 10,000 simulated values, Monte Carlo with 1,000 points and 1,000 repetitions.',
  ],
  sections: [
    { id: 'th-theory', level: 0, title: '1. Theory' },
    {
      id: 'th-cdf',
      level: 1,
      title: '1.1 The distribution function of the normal law',
      blocks: [
        'X ~ N(μ, σ²) has density φ((x - μ)/σ)/σ with φ(z) = e^(-z²/2)/√(2π), and distribution function F(x) = P(X ≤ x), the area under the density to the left of x. Standardizing, F(x) = Φ((x - μ)/σ), so one function, Φ, serves every normal law.',
        {
          formula: [
            'Φ(z) = ∫_(-∞)^z e^(-t²/2)/√(2π) dt = (1 + erf(z/√2))/2',
            'Φ(-z) = 1 - Φ(z),   Φ(0) = 1/2,   Φ′(z) = φ(z)',
          ].join('\n'),
        },
        'Φ has no closed form: Liouville (1835) proved that the antiderivative of e^(-t²) is not an elementary function. So it must be computed, and the assignment asks to do it by numerical integration. Libraries today use rational approximations of erf (Cody, 1969) or continued fractions; the page uses the incomplete gamma function as an independent reference, erfc(x) = Γ(1/2, x²)/√π, so that the quadrature rules are never checked against themselves.',
      ],
    },
    {
      id: 'th-rules',
      level: 1,
      title: '1.2 Quadrature rules and their errors',
      blocks: [
        'A quadrature rule replaces ∫_a^b f with a weighted sum of values of f. With n subintervals of width h = (b - a)/n the composite Newton-Cotes rules are:',
        {
          formula: [
            'left rectangles   L_n = h Σ_(i=0)^(n-1) f(x_i)                 error ≈ (b - a) h f′/2              O(h)',
            'midpoints         M_n = h Σ f(x_i + h/2)                       error = -(b - a) h² f″(ξ)/24        O(h²)',
            'trapezoids        T_n = h [f_0/2 + f_1 + ... + f_(n-1) + f_n/2]   error = (b - a) h² f″(ξ)/12         O(h²)',
            'Simpson           S_n = h/3 [f_0 + 4f_1 + 2f_2 + ... + 4f_(n-1) + f_n]   error = -(b - a) h⁴ f⁽⁴⁾(ξ)/180   O(h⁴)',
          ].join('\n'),
        },
        'The order p means that doubling n divides the error by 2^p: on log-log axes the error is a line of slope -p. On Φ(1.96) the page measures 1.00, 2.00, 2.00 and 4.20, as the theory says. Two facts worth knowing: the midpoint rule is about twice as accurate as the trapezoids, with the opposite sign of the error, and Simpson is exactly the combination (2M + T)/3 that cancels the h² terms, an instance of Richardson’s extrapolation. Simpson integrates cubics exactly, although it is built on parabolas.',
        'The orders hold for smooth functions. A jump or a corner inside a subinterval brings any rule back to first order, because the rule cannot see where inside the subinterval the change happens: this is what the step function of Part 2 shows. Conversely, for a function whose derivatives vanish at both ends (a smooth periodic function, or the traffic curve, almost flat at the ends of the day) the Euler-Maclaurin formula shows that the trapezoid and midpoint rules converge much faster than h²: the page measures order 3.69 on the traffic.',
      ],
    },
    {
      id: 'th-gauss',
      level: 1,
      title: '1.3 Gauss-Legendre',
      blocks: [
        'Newton-Cotes fixes the nodes and chooses the weights. Gauss (1814) chooses both: with n nodes and n weights there are 2n parameters, enough to integrate exactly every polynomial of degree up to 2n - 1. The nodes are the roots of the Legendre polynomial P_n, orthogonal on [-1, 1], and the weights are 2/((1 - t_i²) P_n′(t_i)²), all positive (Jacobi, 1826). The page finds the roots with Newton’s method on the three-term recurrence (k + 1)P_(k+1) = (2k + 1) t P_k - k P_(k-1).',
        {
          formula: [
            '∫_a^b f ≈ (b - a)/2 Σ_(i=1)^n w_i f((a + b)/2 + (b - a)/2 t_i),     P_n(t_i) = 0',
            'error = (b - a)^(2n+1) (n!)⁴ / ((2n + 1) ((2n)!)³) f⁽²ⁿ⁾(ξ)',
          ].join('\n'),
        },
        'For an entire function like φ the error falls faster than any power of 1/n: 8 values of φ give Φ(1.96) to ten decimals, against 129 for Simpson. The weights being positive keeps the rule stable: no cancellation between large terms. A useful picture: the nodes interlace with the partial sums of the weights (Chebyshev, Markov and Stieltjes), so Gauss is a Riemann sum with uneven strips, each node inside its own strip.',
      ],
    },
    {
      id: 'th-infinity',
      level: 1,
      title: '1.4 The infinite limit',
      blocks: [
        'The lower limit of Φ is -∞. Three ways around it, compared on the page:',
        {
          list: [
            'symmetry: Φ(z) = 1/2 + ∫_0^z φ for z ≥ 0, using that φ is even and has total mass 1. It integrates over the shortest interval and loses nothing: with 16 Gauss nodes the error is at most 2.2 × 10^-16;',
            'truncation at -L: the part left out is Φ(-L) ≤ φ(L)/L (Mills’ ratio), 3.2 × 10^-5 for L = 4 and 6.2 × 10^-16 for L = 8. No rule can do better than what is left out, and a longer interval needs more points;',
            'substitution: t = z - (1 - u)/u maps (0, 1] onto (-∞, z] with dt = du/u², and the integrand φ(t)/u² tends to 0 as u → 0. Nothing is left out, but the bell is squeezed near u = 1 and few points do worse (up to 1.4 × 10^-2 with 16 nodes).',
          ],
        },
        'The lesson is general: before adding points, use what is known about the function. Symmetry, a known total mass, a change of variable that flattens the integrand are worth more than brute force.',
      ],
    },
    {
      id: 'th-tails',
      level: 1,
      title: '1.5 Far tails, cancellation and conditioning',
      blocks: [
        'P(Z > k) = 1 - Φ(k). For large k, Φ(k) is a number very close to 1, stored with an absolute error of about ε ≈ 1.1 × 10^-16, so 1 - Φ(k) has a relative error of about ε/P(Z > k): at k = 7 (P = 1.3 × 10^-12) it loses the sixth digit, at k = 8 it is wrong by 61%, at k = 9 it gives 2.2 × 10^-16 instead of 1.1 × 10^-19. It is the same cancellation as the textbook variance formula of Homework #4: subtracting two nearly equal numbers exposes their rounding errors. Integrating the tail directly, Φ(-k) with the substitution, subtracts nothing and keeps 15 digits.',
        'The inverse problem has a conditioning too: a quantile z_p moves by δz ≈ δp/φ(z) when p moves by δp. Far in the tail φ is tiny, so the quantile is sensitive: the double that stores 0.9999 differs from the decimal by 1.1 × 10^-17, and its quantile differs from the decimal one by 2.8 × 10^-14.',
        'In security this matters directly. An intrusion detection system that flags an event when a measurement exceeds the mean by k standard deviations has, for normal data, a false-alarm rate of P(Z > k): with 10^6 events a day, one false alarm a day needs k = 4.7534. The rate depends entirely on the tail model: for data with Student t tails (3 degrees of freedom, same mean and variance) the same threshold gives 1,876 false alarms a day. At k = 2 the heavy-tailed law even gives fewer exceedances (ratio 0.9), at k = 3 five times more, at k = 5 about 5,650 times more.',
      ],
    },
    {
      id: 'th-newton',
      level: 1,
      title: '1.6 Quantiles by Newton’s method',
      blocks: [
        'z_p solves Φ(z) = p. Newton’s method uses the derivative, which here is known exactly, Φ′ = φ:',
        { formula: 'z_(k+1) = z_k - (Φ(z_k) - p)/φ(z_k)' },
        'Φ is concave for z > 0, so from z_0 = 0 the iterates increase monotonically towards the root without overshooting (the tangent lies above the curve); near the root the convergence is quadratic, the error squared at every step. For p = 0.975 the errors after each step are 7.7 × 10^-1, 3.0 × 10^-1, 6.7 × 10^-2, 4.2 × 10^-3, 1.7 × 10^-5, 2.8 × 10^-10, 2.2 × 10^-16: slow while the bell is flat, then the correct digits double. To keep every digit in the tail, the page works on the smaller tail q = 1 - p, which for p ≥ 1/2 is computed exactly (Sterbenz’s lemma), and solves P(Z > w) = q with the tail integrated directly.',
      ],
    },
    {
      id: 'th-ks',
      level: 1,
      title: '1.7 Testing a distribution: Kolmogorov-Smirnov',
      blocks: [
        'Given n values, the empirical distribution function F_n(x) is the share of values ≤ x. By the Glivenko-Cantelli theorem sup |F_n - F| → 0 almost surely when the data come from F. Kolmogorov (1933, in the Giornale dell’Istituto Italiano degli Attuari) found the limit law of √n D_n, D_n = sup |F_n(x) - F(x)|, which does not depend on F:',
        { formula: 'P(√n D_n > x) → 2 Σ_(k≥1) (-1)^(k-1) e^(-2k²x²),     5% critical value 1.358' },
        'For finite n Stephens (1970) suggests (√n + 0.12 + 0.11/√n) D_n. The page draws 10,000 normal values with Box-Muller (two uniforms U₁, U₂ give √(-2 ln U₁) cos(2πU₂) and sin(2πU₂), independent normals) and compares them with the numerical Φ: D = 0.0111, p = 0.166, not rejected. The heavy-tailed values give D = 0.0915, p = 2.8 × 10^-73: the test sees the difference where it is largest, around x = -0.63, in the middle and not only in the tails. A simpler check on the tail itself, the share above 3 standard deviations, gives 0.150% for the normal sample against 0.135% (p = 0.683) and 0.84% for the heavy one (p = 3.6 × 10^-82).',
      ],
    },
    {
      id: 'th-riemann',
      level: 1,
      title: '1.8 The Riemann integral',
      blocks: [
        'Riemann (habilitation thesis of 1854, published after his death) defines ∫_a^b f as the limit of the sums Σ f(t_i)(x_i - x_(i-1)) over partitions whose mesh tends to zero, whatever the points t_i. Darboux (1875) made it concrete with the lower and upper sums:',
        {
          formula: [
            'L(P) = Σ m_i Δx_i,   U(P) = Σ M_i Δx_i,   m_i = inf f, M_i = sup f on [x_(i-1), x_i]',
            'f Riemann integrable  ⇔  inf over P of U(P) - L(P) = 0',
          ].join('\n'),
        },
        'Riemann integrability requires f bounded, and Lebesgue’s criterion says exactly when it holds: f bounded and continuous almost everywhere (its discontinuities form a set of measure zero). So the step function and sin(1/x) (discontinuous only at 0, with 0 defined as its value there) are Riemann integrable; 1/√x is not, because it is unbounded: its integral exists only as an improper integral, the limit of ∫_ε^1 as ε → 0, and the upper Darboux sum is infinite for every partition. For a monotone function U - L = (f(b) - f(a)) h exactly.',
      ],
    },
    {
      id: 'th-lebesgue',
      level: 1,
      title: '1.9 The Lebesgue integral',
      blocks: [
        'Lebesgue (thesis of 1902, Intégrale, longueur, aire, published in the Annali di Matematica Pura ed Applicata) partitions the range instead of the domain. It needs a measure μ of sets more general than intervals (Borel, 1898): the length, extended to countable unions and complements. A simple function takes finitely many values c_k on measurable sets E_k, and its integral is Σ c_k μ(E_k); the integral of f ≥ 0 is the supremum of the integrals of the simple functions below it. Numerically, with K levels between the minimum m and the maximum M:',
        {
          formula: [
            'E_k = {x : f(x) ≥ y_k},   y_k = m + k (M - m)/K',
            'L_K = m (b - a) + Σ_(k=1)^K (y_k - y_(k-1)) μ(E_k),   U_K = m (b - a) + Σ (y_k - y_(k-1)) μ(E_(k-1))',
            'U_K - L_K = (M - m)(b - a)/K,      ∫ f dμ = ∫_0^∞ μ{f > y} dy   (f ≥ 0, the layer cake)',
          ].join('\n'),
        },
        'The guarantee U_K - L_K = (M - m)(b - a)/K does not depend on how wild f is along x: only the measurability of the level sets matters. For a signed function ∫ f = ∫ f⁺ - ∫ f⁻; an unbounded one is cut at a cap T first, and what lies above is the top of the layer cake, 1/T for 1/√x. Every Riemann integrable function is Lebesgue integrable with the same integral; the converse fails: Dirichlet’s function, 1 on the rationals and 0 elsewhere, is not Riemann integrable (L = 0, U = 1 for every partition) and has Lebesgue integral 0, because the rationals are countable and have measure zero.',
        'The real strength of Lebesgue is the theory of limits: the monotone convergence theorem (if 0 ≤ f_n ↑ f then ∫ f_n ↑ ∫ f) and the dominated convergence theorem (if f_n → f and |f_n| ≤ g with ∫ g < ∞ then ∫ f_n → ∫ f) allow limit and integral to be swapped without uniform convergence. Probability is built on it: Kolmogorov (1933) made probability a measure and the expected value a Lebesgue integral, E[X] = ∫ X dP.',
        'As a numerical method Lebesgue is not faster. Its level sets must be measured, here on a grid of 4,096 cells refined with bisection, and the convergence depends on the distribution of the values: for x² the distribution function μ{f ≥ y} = 1 - √y has a square root at the minimum and the measured order is 1.49, not 2. Riemann at the centre wins on smooth functions (x²: 8.0 × 10^-8 against 6.3 × 10^-6 with n = K = 1,024); Lebesgue wins on the step function (4.9 × 10^-5 against 2.0 × 10^-4: the levels fall on the values of the steps), on 1/√x (8.5 × 10^-3 against 1.9 × 10^-2) and narrowly on sin(1/x).',
      ],
    },
    {
      id: 'th-mc',
      level: 1,
      title: '1.10 Monte Carlo',
      blocks: [
        'Monte Carlo (Metropolis and Ulam, 1949) writes the integral as an expectation, ∫_a^b f = (b - a) E[f(U)] with U uniform, and estimates it with the mean of N values. The law of large numbers gives convergence whenever ∫ |f| < ∞; the central limit theorem gives the rate, a standard error (b - a) σ_f/√N, independent of the dimension and of the smoothness of f, and the interval Î ± 1.96 SE. Like Lebesgue it never looks at the order of the points along x, only at the distribution of the values: it is the statistical form of the layer cake.',
        'The interval needs a finite variance. For 1/√x, E[f(U)²] = ∫_0^1 dx/x = ∞: the estimates stay unbiased (mean 1.9957 against 2 over 1,000 repetitions) but are right-skewed (skewness 1.97) and the sample variance underestimates the uncertainty, so the 95% intervals cover only 90.9% of the time, a rejection with p = 2.7 × 10^-9. For the five functions with finite variance the coverage is between 94.1% and 95.4%, as promised. 1/√x is a borderline case: its tail P(f(U) > y) = 1/y² keeps it in the domain of attraction of the normal law, so the coverage returns to 95% as N grows, but only logarithmically slowly.',
      ],
    },
    {
      id: 'th-outline',
      level: 0,
      title: '2. Presentation outline (about 5 minutes)',
      blocks: [
        {
          outline: [
            { time: '0:00', title: 'The assignment', text: 'Part 1: the CDF of a normal density by numerical integration. Part 2: for a choice of functions, the Riemann and the Lebesgue integral computed numerically. Φ has no closed form (Liouville): it must be computed.' },
            { time: '0:30', title: 'Five rules', text: 'Rectangles, midpoints, trapezoids, Simpson, Gauss-Legendre, shown on the bell. Errors O(h), O(h²), O(h²), O(h⁴), exponential. Measured orders on Φ(1.96): 1.00, 2.00, 2.00, 4.20; ten decimals with 8 values of φ for Gauss, 129 for Simpson.' },
            { time: '1:20', title: 'The infinite limit', text: 'Symmetry (1/2 + ∫_0^z, error 2 × 10^-16), truncation at -L (loses Φ(-L), 3.2 × 10^-5 at L = 4), substitution t = z - (1 - u)/u. Use what is known before adding points.' },
            { time: '1:50', title: 'Using the CDF', text: 'The table of the normal rebuilt with 699 values of φ, worst error 1.9 × 10^-12. Quantiles backwards with Newton: 1.959963984540054 in 8 steps, quadratic convergence. The 1.96 of Homework #4.' },
            { time: '2:30', title: 'Tails and alarms', text: '1 - Φ(k) loses all digits at k = 8 (cancellation, as in Homework #4); integrate the tail directly. An IDS with 10^6 events a day needs k = 4.75 for one false alarm a day; with heavy tails the same k gives 1,876. Kolmogorov-Smirnov sees it: D = 0.0915, p = 2.8 × 10^-73.' },
            { time: '3:20', title: 'Riemann and Lebesgue', text: 'Lebesgue’s coins: in order, or grouped by value. Vertical strips against horizontal slices; Darboux’s U - L against Lebesgue’s (M - m)(b - a)/K, which does not depend on the shape along x. Step function exact with 10 levels; 1/√x only improper for Riemann.' },
            { time: '4:10', title: 'Who wins, and the traffic', text: 'As an algorithm Riemann wins on smooth functions, Lebesgue on simple and unbounded ones. On the traffic of a server: Riemann gives the total (2,118 GB, the attack only 3.8%), Lebesgue the minutes above each threshold (13.2 above 500 Mb/s, all during the attack).' },
            { time: '4:40', title: 'Monte Carlo and Dirichlet', text: 'Monte Carlo covers 95% with finite variance, 90.9% on 1/√x (infinite variance). Dirichlet: Lebesgue integral 0, but every double is a rational m/2^k, so for a computer it is 1 everywhere. Conclusion.' },
          ],
        },
        { note: 'Numbers to remember: Φ(1.96) = 0.975002; orders 1, 2, 2, 4; Gauss 8 values against Simpson 129 for 10 decimals; Φ(-4) = 3.2 × 10^-5; z_0.975 = 1.959964 in 8 Newton steps; 1 - Φ(8) wrong by 61%; k = 4.7534 for 10^-6, 1,876 false alarms with t(3) tails; KS D = 0.0111 (normal), 0.0915 (heavy); U - L = (M - m)(b - a)/K; ∫ sin(1/x) = sin 1 - Ci(1) = 0.504067; coverage 90.9% on 1/√x; 0.1 = 3602879701896397/2^55.' },
      ],
    },
    {
      id: 'th-questions',
      level: 0,
      title: '3. Likely questions',
      blocks: [
        {
          qa: [
            { q: 'Why can’t Φ be computed with a formula?', a: 'Because the antiderivative of e^(-t²) is not an elementary function (Liouville, 1835). Φ = (1 + erf(z/√2))/2 only renames the problem: erf itself is computed numerically, by series, continued fractions or rational approximations, or, as here, by quadrature.' },
            { q: 'What is the order of a quadrature rule, and how did you measure it?', a: 'The power p in error ≈ C h^p: doubling n divides the error by 2^p. On log-log axes the error against n is a line of slope -p; a least squares fit on the part above the rounding floor gives 1.00, 2.00, 2.00 and 4.20 for rectangles, midpoints, trapezoids and Simpson.' },
            { q: 'Why is Simpson of order 4 if it uses parabolas?', a: 'By symmetry: on each pair of subintervals the error term in f‴ cancels, so Simpson is exact for cubics and its error involves f⁽⁴⁾: -(b - a)h⁴f⁽⁴⁾/180. Equivalently S = (2M + T)/3 eliminates the h² terms of midpoints and trapezoids (Richardson extrapolation).' },
            { q: 'Why is Gauss-Legendre so much better?', a: 'It chooses the nodes as well as the weights: 2n parameters integrate exactly polynomials up to degree 2n - 1. For an entire function like φ the error decays faster than any power of 1/n: 8 values of φ for ten decimals against 129 for Simpson. Its weights are positive, so it is also numerically stable.' },
            { q: 'How are the Gauss nodes computed?', a: 'They are the roots of the Legendre polynomial P_n. Starting from cos(π(i + 3/4)/(n + 1/2)), Newton’s method with P_n and P_n′ from the three-term recurrence converges in a few steps; the weights are 2/((1 - t²)P_n′(t)²). They are checked against the closed form for n = 5 and NumPy’s leggauss.' },
            { q: 'How do you deal with the infinite lower limit?', a: 'With symmetry: Φ(z) = 1/2 + ∫_0^z φ, because φ is even and integrates to 1, so nothing is lost and the interval is short. Truncating at -L loses Φ(-L) (3.2 × 10^-5 at L = 4); the substitution t = z - (1 - u)/u maps the half-line onto (0, 1] without loss but needs more points.' },
            { q: 'Why is 1 - Φ(k) wrong for large k?', a: 'Catastrophic cancellation: Φ(8) = 1 - 6.2 × 10^-16 is stored with an absolute error of about 10^-16, so the difference has a relative error near 100% (61% on the page). The cure is not to subtract: integrate the tail directly, Φ(-k), which keeps 15 digits up to k = 9.' },
            { q: 'Why does Newton’s method converge, and how fast?', a: 'Φ is concave for z > 0, so starting from 0 the tangent lies above the curve and the iterates increase towards the root without overshooting. Near the root the error is squared at every step (quadratic convergence): for p = 0.975, 4.2 × 10^-3, 1.7 × 10^-5, 2.8 × 10^-10, 2 × 10^-16.' },
            { q: 'What does the alarm example teach?', a: 'That a k-sigma threshold has a false-alarm rate P(Z > k) only if the data are normal. With 10^6 events a day, k = 4.75 gives one false alarm a day; heavy tails with the same variance give 1,876. The tail model must be checked on the data, for example with Kolmogorov-Smirnov, before trusting a threshold.' },
            { q: 'How does the Kolmogorov-Smirnov test work?', a: 'D_n = sup |F_n(x) - F(x)| between the empirical and the hypothesized distribution function; under H₀, √n D_n converges to Kolmogorov’s law, which does not depend on F, with 5% critical value 1.358. It is consistent against every alternative but most sensitive in the middle of the distribution, less in the tails.' },
            { q: 'What is the difference between the Riemann and the Lebesgue integral?', a: 'Riemann partitions the domain and takes heights; Lebesgue partitions the range and measures the sets where f exceeds each level: Σ value × measure. They agree on every Riemann integrable function, but Lebesgue integrates more functions and has better limit theorems.' },
            { q: 'Which functions are Riemann integrable?', a: 'Exactly the bounded functions continuous almost everywhere (Lebesgue’s criterion). The step function and sin(1/x) are; 1/√x is not in the proper sense, because it is unbounded, and its integral 2 exists only as an improper limit; Dirichlet’s function is not, being discontinuous everywhere.' },
            { q: 'What is Lebesgue’s error bound, and why does it matter?', a: 'U_K - L_K = (M - m)(b - a)/K: it depends only on the range and on the number of levels, not on how f behaves along x. Riemann’s U - L depends on the oscillation of f inside each strip. For a monotone function the two coincide, (f(b) - f(a)) h.' },
            { q: 'So is Lebesgue a better numerical method?', a: 'No, and the page shows it honestly: with n = K = 1,024, Riemann at the centre wins on x², on the bell and on the traffic; Lebesgue on the step function, on 1/√x and narrowly on sin(1/x). Measuring level sets costs evaluations. Lebesgue’s strength is theoretical: monotone and dominated convergence, and probability built on measure.' },
            { q: 'Why does Lebesgue converge with order 1.5 on x²?', a: 'Because its error depends on the distribution of the values, not on the smoothness along x. For x² on [0, 1], μ{f ≥ y} = 1 - √y, with a square root singularity at the minimum y = 0: the midpoint sum over levels of such a function converges like K^(-1.5). The page measures 1.49.' },
            { q: 'What does the traffic example show?', a: 'Two questions about the same curve. Riemann: the total, 4,706 Mb/s × hours, 2,118 GB, in which the attack weighs 3.8%. Lebesgue: the measure of {traffic ≥ y} for every threshold, 13.2 minutes above 500 Mb/s, all during the attack. The sorted traffic is the load duration curve, the decreasing rearrangement, with the same area.' },
            { q: 'Why is Monte Carlo related to Lebesgue?', a: 'Because it uses only the distribution of the values of f(U), never the order of the points along x: the mean of f(U) is ∫ y dμ_f(y), an integral over the range, like the layer cake. Its error 1/√N does not depend on the smoothness of f.' },
            { q: 'Why does Monte Carlo fail on 1/√x?', a: 'Its variance is infinite: E[1/U] = ∫_0^1 dx/x = ∞. The estimates stay unbiased, but a few draws near 0 dominate, the sample variance underestimates the spread, and the 95% intervals cover 90.9% (p = 2.7 × 10^-9). Being a borderline case, the coverage creeps back to 95% only logarithmically as N grows.' },
            { q: 'Why can’t a computer integrate Dirichlet’s function?', a: 'Because every double is a dyadic rational m/2^k: 0.1 is 3602879701896397/2^55, π/4 is 884279719003555/2^50. The function is 1 at every point a program can represent, so any numerical sum gives 1, while the Lebesgue integral is 0: the representable numbers are a finite, hence measure-zero, set.' },
          ],
        },
      ],
    },
  ],
};

const it = {
  intro: [
    'Questa pagina raccoglie la teoria dietro all’Homework #5, per studiarla e spiegarla alla cattedra: perché la funzione di ripartizione della normale va calcolata numericamente, come funzionano le regole di quadratura e quanto in fretta convergono, Gauss-Legendre, il limite infinito, le code lontane e la loro cancellazione, i quantili con il metodo di Newton, il test di Kolmogorov-Smirnov, poi gli integrali di Riemann e di Lebesgue e Monte Carlo. Una parte ripete di proposito la pagina dell’homework.',
    'La sezione 1 è la teoria, la 2 una scaletta per presentare l’homework in circa cinque minuti, la 3 le domande che il professore farà probabilmente, con risposte brevi da dire a voce. Le risposte restano chiuse: provate a rispondere, poi apritele. I numeri citati sono quelli della pagina dell’homework con i valori iniziali: seme 2026, 10.000 valori simulati, Monte Carlo con 1.000 punti e 1.000 ripetizioni.',
  ],
  sections: [
    { id: 'th-theory', level: 0, title: '1. Teoria' },
    {
      id: 'th-cdf',
      level: 1,
      title: '1.1 La funzione di ripartizione della normale',
      blocks: [
        'X ~ N(μ, σ²) ha densità φ((x - μ)/σ)/σ con φ(z) = e^(-z²/2)/√(2π), e funzione di ripartizione F(x) = P(X ≤ x), l’area sotto la densità a sinistra di x. Standardizzando, F(x) = Φ((x - μ)/σ): una sola funzione, Φ, serve per ogni normale.',
        {
          formula: [
            'Φ(z) = ∫_(-∞)^z e^(-t²/2)/√(2π) dt = (1 + erf(z/√2))/2',
            'Φ(-z) = 1 - Φ(z),   Φ(0) = 1/2,   Φ′(z) = φ(z)',
          ].join('\n'),
        },
        'Φ non ha una forma chiusa: Liouville (1835) dimostrò che la primitiva di e^(-t²) non è una funzione elementare. Va quindi calcolata, e la consegna chiede di farlo per integrazione numerica. Le librerie oggi usano approssimazioni razionali di erf (Cody, 1969) o frazioni continue; la pagina usa la funzione gamma incompleta come riferimento indipendente, erfc(x) = Γ(1/2, x²)/√π, così le regole di quadratura non sono mai controllate con sé stesse.',
      ],
    },
    {
      id: 'th-rules',
      level: 1,
      title: '1.2 Le regole di quadratura e i loro errori',
      blocks: [
        'Una regola di quadratura sostituisce ∫_a^b f con una somma pesata di valori di f. Con n sottointervalli di ampiezza h = (b - a)/n le regole composte di Newton-Cotes sono:',
        {
          formula: [
            'rettangoli (sinistra)   L_n = h Σ_(i=0)^(n-1) f(x_i)                 errore ≈ (b - a) h f′/2              O(h)',
            'punti medi              M_n = h Σ f(x_i + h/2)                       errore = -(b - a) h² f″(ξ)/24        O(h²)',
            'trapezi                 T_n = h [f_0/2 + f_1 + ... + f_(n-1) + f_n/2]   errore = (b - a) h² f″(ξ)/12         O(h²)',
            'Simpson                 S_n = h/3 [f_0 + 4f_1 + 2f_2 + ... + 4f_(n-1) + f_n]   errore = -(b - a) h⁴ f⁽⁴⁾(ξ)/180   O(h⁴)',
          ].join('\n'),
        },
        'L’ordine p vuol dire che raddoppiando n l’errore si divide per 2^p: su scale logaritmiche l’errore è una retta di pendenza -p. Su Φ(1,96) la pagina misura 1,00, 2,00, 2,00 e 4,20, come dice la teoria. Due fatti da sapere: i punti medi sono circa due volte più precisi dei trapezi, con errore di segno opposto, e Simpson è proprio la combinazione (2M + T)/3 che cancella i termini in h², un caso dell’estrapolazione di Richardson. Simpson integra esattamente le cubiche, anche se è costruito sulle parabole.',
        'Gli ordini valgono per funzioni lisce. Un salto o un angolo dentro un sottointervallo riporta qualunque regola al primo ordine, perché la regola non vede dove avviene il cambiamento: lo mostra la funzione a gradini della Part 2. Al contrario, per una funzione con le derivate nulle agli estremi (una funzione periodica liscia, o la curva del traffico, quasi piatta all’inizio e alla fine del giorno) la formula di Euler-Maclaurin mostra che trapezi e punti medi convergono molto più in fretta di h²: sul traffico la pagina misura l’ordine 3,69.',
      ],
    },
    {
      id: 'th-gauss',
      level: 1,
      title: '1.3 Gauss-Legendre',
      blocks: [
        'Newton-Cotes fissa i nodi e sceglie i pesi. Gauss (1814) sceglie entrambi: con n nodi e n pesi ci sono 2n parametri, abbastanza per integrare esattamente ogni polinomio di grado fino a 2n - 1. I nodi sono le radici del polinomio di Legendre P_n, ortogonale su [-1, 1], e i pesi sono 2/((1 - t_i²) P_n′(t_i)²), tutti positivi (Jacobi, 1826). La pagina trova le radici con il metodo di Newton sulla ricorrenza a tre termini (k + 1)P_(k+1) = (2k + 1) t P_k - k P_(k-1).',
        {
          formula: [
            '∫_a^b f ≈ (b - a)/2 Σ_(i=1)^n w_i f((a + b)/2 + (b - a)/2 t_i),     P_n(t_i) = 0',
            'errore = (b - a)^(2n+1) (n!)⁴ / ((2n + 1) ((2n)!)³) f⁽²ⁿ⁾(ξ)',
          ].join('\n'),
        },
        'Per una funzione intera come φ l’errore scende più in fretta di qualunque potenza di 1/n: 8 valori di φ danno Φ(1,96) con dieci decimali, contro 129 per Simpson. I pesi positivi rendono la regola stabile: nessuna cancellazione fra termini grandi. Un’immagine utile: i nodi si alternano con le somme parziali dei pesi (Chebyshev, Markov e Stieltjes), quindi Gauss è una somma di Riemann con strisce disuguali, ogni nodo dentro la sua striscia.',
      ],
    },
    {
      id: 'th-infinity',
      level: 1,
      title: '1.4 Il limite infinito',
      blocks: [
        'Il limite inferiore di Φ è -∞. Tre modi per aggirarlo, confrontati nella pagina:',
        {
          list: [
            'simmetria: Φ(z) = 1/2 + ∫_0^z φ per z ≥ 0, usando che φ è pari e ha massa totale 1. Integra sull’intervallo più corto e non perde niente: con 16 nodi di Gauss l’errore è al massimo 2,2 × 10^-16;',
            'troncamento a -L: resta fuori Φ(-L) ≤ φ(L)/L (rapporto di Mills), 3,2 × 10^-5 per L = 4 e 6,2 × 10^-16 per L = 8. Nessuna regola fa meglio di quello che resta fuori, e un intervallo più lungo vuole più punti;',
            'sostituzione: t = z - (1 - u)/u porta (0, 1] su (-∞, z] con dt = du/u², e l’integranda φ(t)/u² tende a 0 per u → 0. Non resta fuori niente, ma la campana si schiaccia vicino a u = 1 e con pochi punti si sbaglia di più (fino a 1,4 × 10^-2 con 16 nodi).',
          ],
        },
        'La lezione è generale: prima di aggiungere punti conviene usare quello che si sa della funzione. Simmetria, massa totale nota, un cambio di variabile che appiattisce l’integranda valgono più della forza bruta.',
      ],
    },
    {
      id: 'th-tails',
      level: 1,
      title: '1.5 Code lontane, cancellazione e condizionamento',
      blocks: [
        'P(Z > k) = 1 - Φ(k). Per k grande Φ(k) è un numero vicinissimo a 1, memorizzato con un errore assoluto di circa ε ≈ 1,1 × 10^-16, quindi 1 - Φ(k) ha un errore relativo di circa ε/P(Z > k): a k = 7 (P = 1,3 × 10^-12) perde la sesta cifra, a k = 8 sbaglia del 61%, a k = 9 dà 2,2 × 10^-16 invece di 1,1 × 10^-19. È la stessa cancellazione della formula da manuale della varianza dell’Homework #4: sottrarre due numeri quasi uguali mette a nudo i loro arrotondamenti. Integrando la coda direttamente, Φ(-k) con la sostituzione, non si sottrae niente e restano 15 cifre.',
        'Anche il problema inverso ha un condizionamento: un quantile z_p si sposta di δz ≈ δp/φ(z) quando p si sposta di δp. Lontano nella coda φ è minuscola, quindi il quantile è sensibile: il double che memorizza 0,9999 differisce dal decimale di 1,1 × 10^-17, e il suo quantile differisce da quello del decimale di 2,8 × 10^-14.',
        'Nella sicurezza informatica questo conta direttamente. Un sistema di rilevamento delle intrusioni che segnala un evento quando una misura supera la media di k deviazioni standard ha, per dati normali, una frequenza di falsi allarmi pari a P(Z > k): con 10^6 eventi al giorno, un falso allarme al giorno vuole k = 4,7534. La frequenza dipende tutta dal modello della coda: per dati con le code di una t di Student (3 gradi di libertà, stessa media e stessa varianza) la stessa soglia dà 1.876 falsi allarmi al giorno. A k = 2 la legge a code pesanti dà addirittura meno superamenti (rapporto 0,9), a k = 3 cinque volte di più, a k = 5 circa 5.650 volte di più.',
      ],
    },
    {
      id: 'th-newton',
      level: 1,
      title: '1.6 I quantili con il metodo di Newton',
      blocks: [
        'z_p risolve Φ(z) = p. Il metodo di Newton usa la derivata, che qui è nota esattamente, Φ′ = φ:',
        { formula: 'z_(k+1) = z_k - (Φ(z_k) - p)/φ(z_k)' },
        'Φ è concava per z > 0, quindi partendo da z_0 = 0 le iterate crescono verso la radice senza superarla (la tangente sta sopra la curva); vicino alla radice la convergenza è quadratica, l’errore al quadrato a ogni passo. Per p = 0,975 gli errori dopo ogni passo sono 7,7 × 10^-1, 3,0 × 10^-1, 6,7 × 10^-2, 4,2 × 10^-3, 1,7 × 10^-5, 2,8 × 10^-10, 2,2 × 10^-16: lenti finché la campana è piatta, poi le cifre giuste raddoppiano. Per tenere ogni cifra nella coda la pagina lavora sulla coda più piccola q = 1 - p, che per p ≥ 1/2 si calcola esattamente (lemma di Sterbenz), e risolve P(Z > w) = q con la coda integrata direttamente.',
      ],
    },
    {
      id: 'th-ks',
      level: 1,
      title: '1.7 Mettere alla prova una legge: Kolmogorov-Smirnov',
      blocks: [
        'Dati n valori, la funzione di ripartizione empirica F_n(x) è la quota di valori ≤ x. Per il teorema di Glivenko-Cantelli sup |F_n - F| → 0 quasi certamente se i dati vengono da F. Kolmogorov (1933, sul Giornale dell’Istituto Italiano degli Attuari) trovò la legge limite di √n D_n, D_n = sup |F_n(x) - F(x)|, che non dipende da F:',
        { formula: 'P(√n D_n > x) → 2 Σ_(k≥1) (-1)^(k-1) e^(-2k²x²),     valore critico al 5%: 1,358' },
        'Per n finito Stephens (1970) suggerisce (√n + 0,12 + 0,11/√n) D_n. La pagina estrae 10.000 valori normali con Box-Muller (due uniformi U₁, U₂ danno √(-2 ln U₁) cos(2πU₂) e sin(2πU₂), normali indipendenti) e li confronta con la Φ numerica: D = 0,0111, p = 0,166, non rifiutata. I valori a code pesanti danno D = 0,0915, p = 2,8 × 10^-73: il test vede la differenza dove è più grande, intorno a x = -0,63, al centro e non solo nelle code. Un controllo più semplice sulla coda stessa, la quota oltre 3 deviazioni standard, dà 0,150% per il campione normale contro 0,135% (p = 0,683) e 0,84% per quello a code pesanti (p = 3,6 × 10^-82).',
      ],
    },
    {
      id: 'th-riemann',
      level: 1,
      title: '1.8 L’integrale di Riemann',
      blocks: [
        'Riemann (tesi di abilitazione del 1854, pubblicata dopo la sua morte) definisce ∫_a^b f come limite delle somme Σ f(t_i)(x_i - x_(i-1)) su partizioni con passo che tende a zero, qualunque siano i punti t_i. Darboux (1875) lo rese concreto con le somme inferiore e superiore:',
        {
          formula: [
            'L(P) = Σ m_i Δx_i,   U(P) = Σ M_i Δx_i,   m_i = inf f, M_i = sup f su [x_(i-1), x_i]',
            'f integrabile secondo Riemann  ⇔  inf su P di U(P) - L(P) = 0',
          ].join('\n'),
        },
        'L’integrabilità secondo Riemann richiede f limitata, e il criterio di Lebesgue dice esattamente quando vale: f limitata e continua quasi ovunque (le sue discontinuità formano un insieme di misura zero). Quindi la funzione a gradini e sin(1/x) (discontinua solo in 0, dove vale 0 per definizione) sono integrabili secondo Riemann; 1/√x no, perché è illimitata: il suo integrale esiste solo come integrale improprio, il limite di ∫_ε^1 per ε → 0, e la somma superiore di Darboux è infinita per ogni partizione. Per una funzione monotona U - L = (f(b) - f(a)) h esattamente.',
      ],
    },
    {
      id: 'th-lebesgue',
      level: 1,
      title: '1.9 L’integrale di Lebesgue',
      blocks: [
        'Lebesgue (tesi del 1902, Intégrale, longueur, aire, pubblicata negli Annali di Matematica Pura ed Applicata) divide l’insieme dei valori invece del dominio. Gli serve una misura μ di insiemi più generali degli intervalli (Borel, 1898): la lunghezza, estesa alle unioni numerabili e ai complementari. Una funzione semplice assume un numero finito di valori c_k su insiemi misurabili E_k, e il suo integrale è Σ c_k μ(E_k); l’integrale di f ≥ 0 è l’estremo superiore degli integrali delle funzioni semplici che le stanno sotto. Numericamente, con K livelli fra il minimo m e il massimo M:',
        {
          formula: [
            'E_k = {x : f(x) ≥ y_k},   y_k = m + k (M - m)/K',
            'L_K = m (b - a) + Σ_(k=1)^K (y_k - y_(k-1)) μ(E_k),   U_K = m (b - a) + Σ (y_k - y_(k-1)) μ(E_(k-1))',
            'U_K - L_K = (M - m)(b - a)/K,      ∫ f dμ = ∫_0^∞ μ{f > y} dy   (f ≥ 0, la torta a strati)',
          ].join('\n'),
        },
        'La garanzia U_K - L_K = (M - m)(b - a)/K non dipende da quanto f è irregolare lungo x: conta solo che gli insiemi di livello siano misurabili. Per una funzione con segno ∫ f = ∫ f⁺ - ∫ f⁻; una illimitata si taglia prima a un tetto T, e quello che sta sopra è la cima della torta a strati, 1/T per 1/√x. Ogni funzione integrabile secondo Riemann lo è secondo Lebesgue con lo stesso integrale; il contrario no: la funzione di Dirichlet, 1 sui razionali e 0 altrove, non è integrabile secondo Riemann (L = 0, U = 1 per ogni partizione) e ha integrale di Lebesgue 0, perché i razionali sono numerabili e hanno misura zero.',
        'La vera forza di Lebesgue è la teoria dei limiti: il teorema della convergenza monotona (se 0 ≤ f_n ↑ f allora ∫ f_n ↑ ∫ f) e quello della convergenza dominata (se f_n → f e |f_n| ≤ g con ∫ g < ∞ allora ∫ f_n → ∫ f) permettono di scambiare limite e integrale senza convergenza uniforme. La probabilità è costruita su questo: Kolmogorov (1933) fece della probabilità una misura e del valore atteso un integrale di Lebesgue, E[X] = ∫ X dP.',
        'Come metodo numerico Lebesgue non è più veloce. I suoi insiemi di livello vanno misurati, qui su una griglia di 4.096 celle raffinata con la bisezione, e la convergenza dipende dalla distribuzione dei valori: per x² la funzione di distribuzione μ{f ≥ y} = 1 - √y ha una radice quadrata nel minimo e l’ordine misurato è 1,49, non 2. Riemann al centro vince sulle funzioni lisce (x²: 8,0 × 10^-8 contro 6,3 × 10^-6 con n = K = 1.024); Lebesgue vince sulla funzione a gradini (4,9 × 10^-5 contro 2,0 × 10^-4: i livelli cadono sui valori dei gradini), su 1/√x (8,5 × 10^-3 contro 1,9 × 10^-2) e di poco su sin(1/x).',
      ],
    },
    {
      id: 'th-mc',
      level: 1,
      title: '1.10 Monte Carlo',
      blocks: [
        'Monte Carlo (Metropolis e Ulam, 1949) scrive l’integrale come valore atteso, ∫_a^b f = (b - a) E[f(U)] con U uniforme, e lo stima con la media di N valori. La legge dei grandi numeri garantisce la convergenza quando ∫ |f| < ∞; il teorema del limite centrale dà la velocità, un errore standard (b - a) σ_f/√N, indipendente dalla dimensione e dalla regolarità di f, e l’intervallo Î ± 1,96 SE. Come Lebesgue non guarda mai l’ordine dei punti lungo x, solo la distribuzione dei valori: è la forma statistica della torta a strati.',
        'L’intervallo vuole una varianza finita. Per 1/√x, E[f(U)²] = ∫_0^1 dx/x = ∞: le stime restano corrette in media (1,9957 contro 2 su 1.000 ripetizioni) ma sono asimmetriche a destra (asimmetria 1,97) e la varianza campionaria sottovaluta l’incertezza, quindi gli intervalli al 95% coprono solo il 90,9% delle volte, un rifiuto con p = 2,7 × 10^-9. Per le cinque funzioni con varianza finita la copertura sta fra il 94,1% e il 95,4%, come promesso. 1/√x è un caso al limite: la sua coda P(f(U) > y) = 1/y² la tiene nel dominio di attrazione della normale, quindi al crescere di N la copertura torna al 95%, ma con una lentezza logaritmica.',
      ],
    },
    {
      id: 'th-outline',
      level: 0,
      title: '2. Scaletta per la presentazione (circa 5 minuti)',
      blocks: [
        {
          outline: [
            { time: '0:00', title: 'La consegna', text: 'Part 1: la CDF di una densità normale per integrazione numerica. Part 2: per una scelta di funzioni, gli integrali di Riemann e di Lebesgue calcolati numericamente. Φ non ha forma chiusa (Liouville): va calcolata.' },
            { time: '0:30', title: 'Cinque regole', text: 'Rettangoli, punti medi, trapezi, Simpson, Gauss-Legendre, mostrati sulla campana. Errori O(h), O(h²), O(h²), O(h⁴), esponenziale. Ordini misurati su Φ(1,96): 1,00, 2,00, 2,00, 4,20; dieci decimali con 8 valori di φ per Gauss, 129 per Simpson.' },
            { time: '1:20', title: 'Il limite infinito', text: 'Simmetria (1/2 + ∫_0^z, errore 2 × 10^-16), troncamento a -L (perde Φ(-L), 3,2 × 10^-5 per L = 4), sostituzione t = z - (1 - u)/u. Usare quello che si sa prima di aggiungere punti.' },
            { time: '1:50', title: 'Usare la CDF', text: 'La tavola della normale ricostruita con 699 valori di φ, errore massimo 1,9 × 10^-12. Quantili all’indietro con Newton: 1,959963984540054 in 8 passi, convergenza quadratica. L’1,96 dell’Homework #4.' },
            { time: '2:30', title: 'Code e allarmi', text: '1 - Φ(k) perde tutte le cifre a k = 8 (cancellazione, come nell’Homework #4); la coda va integrata direttamente. Un IDS con 10^6 eventi al giorno vuole k = 4,75 per un falso allarme al giorno; con code pesanti lo stesso k ne dà 1.876. Kolmogorov-Smirnov se ne accorge: D = 0,0915, p = 2,8 × 10^-73.' },
            { time: '3:20', title: 'Riemann e Lebesgue', text: 'Le monete di Lebesgue: in ordine, o raggruppate per valore. Strisce verticali contro fette orizzontali; U - L di Darboux contro (M - m)(b - a)/K di Lebesgue, che non dipende dalla forma lungo x. Funzione a gradini esatta con 10 livelli; 1/√x solo impropria per Riemann.' },
            { time: '4:10', title: 'Chi vince, e il traffico', text: 'Come algoritmo Riemann vince sulle funzioni lisce, Lebesgue su quelle semplici e illimitate. Sul traffico di un server: Riemann dà il totale (2.118 GB, l’attacco solo il 3,8%), Lebesgue i minuti sopra ogni soglia (13,2 sopra 500 Mb/s, tutti durante l’attacco).' },
            { time: '4:40', title: 'Monte Carlo e Dirichlet', text: 'Monte Carlo copre il 95% con varianza finita, il 90,9% su 1/√x (varianza infinita). Dirichlet: integrale di Lebesgue 0, ma ogni double è un razionale m/2^k, quindi per il computer vale 1 dappertutto. Conclusione.' },
          ],
        },
        { note: 'Numeri da ricordare: Φ(1,96) = 0,975002; ordini 1, 2, 2, 4; Gauss 8 valori contro 129 di Simpson per 10 decimali; Φ(-4) = 3,2 × 10^-5; z_0,975 = 1,959964 in 8 passi di Newton; 1 - Φ(8) sbaglia del 61%; k = 4,7534 per 10^-6, 1.876 falsi allarmi con code t(3); KS D = 0,0111 (normale), 0,0915 (code pesanti); U - L = (M - m)(b - a)/K; ∫ sin(1/x) = sin 1 - Ci(1) = 0,504067; copertura 90,9% su 1/√x; 0,1 = 3602879701896397/2^55.' },
      ],
    },
    {
      id: 'th-questions',
      level: 0,
      title: '3. Domande probabili',
      blocks: [
        {
          qa: [
            { q: 'Perché Φ non si calcola con una formula?', a: 'Perché la primitiva di e^(-t²) non è una funzione elementare (Liouville, 1835). Scrivere Φ = (1 + erf(z/√2))/2 cambia solo nome al problema: erf stessa si calcola numericamente, con serie, frazioni continue o approssimazioni razionali, oppure, come qui, con la quadratura.' },
            { q: 'Che cos’è l’ordine di una regola, e come l’avete misurato?', a: 'La potenza p in errore ≈ C h^p: raddoppiando n l’errore si divide per 2^p. Su scale logaritmiche l’errore contro n è una retta di pendenza -p; una regressione ai minimi quadrati sulla parte sopra il pavimento degli arrotondamenti dà 1,00, 2,00, 2,00 e 4,20 per rettangoli, punti medi, trapezi e Simpson.' },
            { q: 'Perché Simpson è di ordine 4 se usa parabole?', a: 'Per simmetria: su ogni coppia di sottointervalli il termine d’errore in f‴ si cancella, quindi Simpson è esatto per le cubiche e il suo errore coinvolge f⁽⁴⁾: -(b - a)h⁴f⁽⁴⁾/180. Allo stesso modo S = (2M + T)/3 elimina i termini in h² di punti medi e trapezi (estrapolazione di Richardson).' },
            { q: 'Perché Gauss-Legendre è tanto migliore?', a: 'Sceglie i nodi oltre ai pesi: 2n parametri integrano esattamente i polinomi fino al grado 2n - 1. Per una funzione intera come φ l’errore scende più in fretta di qualunque potenza di 1/n: 8 valori di φ per dieci decimali contro 129 di Simpson. I pesi sono positivi, quindi è anche stabile numericamente.' },
            { q: 'Come si calcolano i nodi di Gauss?', a: 'Sono le radici del polinomio di Legendre P_n. Partendo da cos(π(i + 3/4)/(n + 1/2)), il metodo di Newton con P_n e P_n′ dalla ricorrenza a tre termini converge in pochi passi; i pesi sono 2/((1 - t²)P_n′(t)²). Sono controllati contro la formula chiusa per n = 5 e contro leggauss di NumPy.' },
            { q: 'Come trattate il limite inferiore infinito?', a: 'Con la simmetria: Φ(z) = 1/2 + ∫_0^z φ, perché φ è pari e ha integrale 1, quindi non si perde niente e l’intervallo è corto. Troncare a -L perde Φ(-L) (3,2 × 10^-5 per L = 4); la sostituzione t = z - (1 - u)/u porta la semiretta su (0, 1] senza perdite ma vuole più punti.' },
            { q: 'Perché 1 - Φ(k) è sbagliato per k grande?', a: 'Cancellazione catastrofica: Φ(8) = 1 - 6,2 × 10^-16 è memorizzato con un errore assoluto di circa 10^-16, quindi la differenza ha un errore relativo vicino al 100% (61% nella pagina). La cura è non sottrarre: integrare direttamente la coda, Φ(-k), che tiene 15 cifre fino a k = 9.' },
            { q: 'Perché il metodo di Newton converge, e quanto in fretta?', a: 'Φ è concava per z > 0, quindi partendo da 0 la tangente sta sopra la curva e le iterate crescono verso la radice senza superarla. Vicino alla radice l’errore si eleva al quadrato a ogni passo (convergenza quadratica): per p = 0,975, 4,2 × 10^-3, 1,7 × 10^-5, 2,8 × 10^-10, 2 × 10^-16.' },
            { q: 'Che cosa insegna l’esempio degli allarmi?', a: 'Che una soglia a k sigma ha una frequenza di falsi allarmi P(Z > k) solo se i dati sono normali. Con 10^6 eventi al giorno, k = 4,75 dà un falso allarme al giorno; code pesanti con la stessa varianza ne danno 1.876. Il modello della coda va controllato sui dati, per esempio con Kolmogorov-Smirnov, prima di fidarsi di una soglia.' },
            { q: 'Come funziona il test di Kolmogorov-Smirnov?', a: 'D_n = sup |F_n(x) - F(x)| fra la funzione di ripartizione empirica e quella ipotizzata; sotto H₀, √n D_n converge alla legge di Kolmogorov, che non dipende da F, con valore critico al 5% pari a 1,358. È consistente contro ogni alternativa ma più sensibile al centro della distribuzione, meno nelle code.' },
            { q: 'Qual è la differenza fra l’integrale di Riemann e quello di Lebesgue?', a: 'Riemann divide il dominio e prende le altezze; Lebesgue divide i valori e misura gli insiemi dove f supera ogni livello: Σ valore × misura. Coincidono su ogni funzione integrabile secondo Riemann, ma Lebesgue integra più funzioni e ha teoremi migliori sui limiti.' },
            { q: 'Quali funzioni sono integrabili secondo Riemann?', a: 'Esattamente quelle limitate e continue quasi ovunque (criterio di Lebesgue). La funzione a gradini e sin(1/x) lo sono; 1/√x no in senso proprio, perché è illimitata, e il suo integrale 2 esiste solo come limite improprio; la funzione di Dirichlet no, perché è discontinua ovunque.' },
            { q: 'Qual è la stima d’errore di Lebesgue, e perché conta?', a: 'U_K - L_K = (M - m)(b - a)/K: dipende solo dall’ampiezza dei valori e dal numero di livelli, non da come f si comporta lungo x. U - L di Riemann dipende invece dall’oscillazione di f dentro ogni striscia. Per una funzione monotona le due coincidono, (f(b) - f(a)) h.' },
            { q: 'Allora Lebesgue è un metodo numerico migliore?', a: 'No, e la pagina lo mostra con onestà: con n = K = 1.024 Riemann al centro vince su x², sulla campana e sul traffico; Lebesgue sulla funzione a gradini, su 1/√x e di poco su sin(1/x). Misurare gli insiemi di livello costa valutazioni. La forza di Lebesgue è teorica: convergenza monotona e dominata, e la probabilità costruita sulla misura.' },
            { q: 'Perché Lebesgue converge con ordine 1,5 su x²?', a: 'Perché il suo errore dipende dalla distribuzione dei valori, non dalla regolarità lungo x. Per x² su [0, 1], μ{f ≥ y} = 1 - √y, con una singolarità a radice quadrata nel minimo y = 0: la somma ai punti medi sui livelli di una funzione così converge come K^(-1,5). La pagina misura 1,49.' },
            { q: 'Che cosa mostra l’esempio del traffico?', a: 'Due domande sulla stessa curva. Riemann: il totale, 4.706 Mb/s × ore, 2.118 GB, in cui l’attacco pesa il 3,8%. Lebesgue: la misura di {traffico ≥ y} per ogni soglia, 13,2 minuti sopra 500 Mb/s, tutti durante l’attacco. Il traffico ordinato è la curva di durata del carico, il riordinamento decrescente, con la stessa area.' },
            { q: 'Perché Monte Carlo è parente di Lebesgue?', a: 'Perché usa solo la distribuzione dei valori di f(U), mai l’ordine dei punti lungo x: la media di f(U) è ∫ y dμ_f(y), un integrale sui valori, come la torta a strati. Il suo errore 1/√N non dipende dalla regolarità di f.' },
            { q: 'Perché Monte Carlo sbaglia su 1/√x?', a: 'Ha varianza infinita: E[1/U] = ∫_0^1 dx/x = ∞. Le stime restano corrette in media, ma poche estrazioni vicino a 0 dominano, la varianza campionaria sottovaluta la dispersione, e gli intervalli al 95% coprono il 90,9% (p = 2,7 × 10^-9). Essendo un caso al limite, al crescere di N la copertura torna al 95% solo con lentezza logaritmica.' },
            { q: 'Perché un computer non può integrare la funzione di Dirichlet?', a: 'Perché ogni double è un razionale diadico m/2^k: 0,1 è 3602879701896397/2^55, π/4 è 884279719003555/2^50. La funzione vale 1 in ogni punto che un programma può rappresentare, quindi qualunque somma numerica dà 1, mentre l’integrale di Lebesgue è 0: i numeri rappresentabili sono un insieme finito, quindi di misura zero.' },
          ],
        },
      ],
    },
  ],
};

const THEORY = { en, it };
export default THEORY;
