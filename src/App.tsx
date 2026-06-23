import {
  Check,
  Download,
  FileText,
  Github,
  Mail,
  Play,
  Sparkles,
} from 'lucide-react';
import { Fragment, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { assetPaths, assetUrl } from './data/assets';
import { highlights, type HighlightCard, type HighlightImage } from './data/highlights';
import { useRevealOnScroll } from './hooks/useRevealOnScroll';

const ModalityViewer = lazy(() => import('./components/ModalityViewer').then((module) => ({ default: module.ModalityViewer })));

type Stat = {
  label: string;
  value: number;
  suffix?: string;
  detail: string;
};

type AssetCard = {
  title: string;
  body: string;
  images: HighlightImage[];
};

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
} & React.HTMLAttributes<HTMLDivElement>;

const navItems = [
  ['Overview', 'overview'],
  ['Dataset', 'dataset'],
  ['Highlights', 'actors'],
  ['Benchmarks', 'benchmarks'],
  ['Access', 'access'],
  ['Citation', 'citation'],
  ['Contact', 'contact'],
] as const;

const contactEmail = 'giulia.martinelli-2@unitn.it';
const paperUrl = 'http://arxiv.org/abs/2606.23062';

const teamMembers = [
  {
    name: 'Giulia Martinelli',
    url: 'https://giuli13.github.io/',
    image: '/assets/team/GiuliaMartinelli.jpg',
  },
  {
    name: 'Niccoló Bisagno',
    url: 'https://scholar.google.com/citations?user=I6vOrqkAAAAJ&hl=it',
    image: '/assets/team/NiccoloBisagno.jpg',
  },
  {
    name: 'Nicola Garau',
    url: 'https://scholar.google.com/citations?user=r8BzAfcAAAAJ&hl=en',
    image: '/assets/team/NicolaGarau.jpg',
  },
  {
    name: 'Esa Rahtu',
    url: 'https://esa.rahtu.fi/',
    image: '/assets/team/EsaRahtu.jpg',
  },
  {
    name: 'Nicola Conci',
    url: 'https://scholar.google.com/citations?user=mR1GK28AAAAJ&hl=it',
    image: '/assets/team/NicolaConci.jpg',
  },
] as const;

const stats: Stat[] = [
  { label: 'Subjects', value: 104, detail: 'diverse identities, garments, motion styles' },
  { label: 'Annotated Frames', value: 156000, detail: 'temporally aligned volumetric captures' },
  { label: 'RGB Cameras', value: 64, detail: 'synchronized high-resolution color views' },
  { label: 'Depth Cameras', value: 32, detail: 'dense geometry support for reconstruction' },
  { label: 'Frame Rate', value: 25, suffix: ' fps', detail: 'sequence capture for 4D evaluation' },
  { label: 'Capture Volume', value: 3, suffix: ' m tall', detail: '2.5 m diameter calibrated stage' },
];

const overviewBullets = [
  {
    label: 'Complete 4D Ground Truth',
    text: 'Multi-view RGB-D, high-resolution textured meshes, dense point clouds, normal maps, rigged assets, garment segmentation, and SMPL-X fittings in one dataset.',
    tone: 'blue',
  },
  {
    label: 'Close-Range High Fidelity',
    text: 'Unlike distant full-body capture setups, VolHuMe preserves fine body-part detail across clothing, hands, face, and local geometry.',
    tone: 'cyan',
  },
  {
    label: 'Accurate Parametric Fits',
    text: 'A semi-automatic SMPL-X pipeline aligns body, hands, and face to the scans, reaching 4.73 mm skin error.',
    tone: 'orange',
  },
  {
    label: 'Challenging Benchmarks',
    text: 'VolHuMe evaluates view synthesis, 3D mesh estimation, and 4D reconstruction, exposing the limits of current NeRF, 3DGS, and avatar methods.',
    tone: 'blue',
  },
] as const;

const benchmarks: AssetCard[] = [
  {
    title: 'Novel-View Rendering',
    body: 'VolHuMe evaluates view synthesis and mesh estimation under close-range sparse-view capture. Current methods produce compelling renderings, but still struggle to recover the finest details present in the high-resolution ground-truth mesh.',
    images: [
      {
        src: '/assets/highlights/benchmarks/image_01.png',
        alt: 'Novel-view rendering and mesh estimation benchmark results on VolHuMe.',
      },
    ],
  },
  {
    title: '4D Human Reconstruction',
    body: 'VolHuMe evaluates dynamic human reconstruction across full motion sequences. GPS-Gaussian and Animatable Gaussians expose different challenges in template-free and per-character reconstruction pipelines.',
    images: [
      {
        src: '/assets/highlights/benchmarks/GPS.jpg',
        alt: 'GPS-Gaussian qualitative reconstruction results on VolHuMe.',
      },
      {
        src: '/assets/highlights/benchmarks/GT_GPS.jpg',
        alt: 'Ground truth and GPS-Gaussian comparison on VolHuMe.',
      },
      {
        src: '/assets/highlights/benchmarks/animatable1.jpg',
        alt: 'Animatable Gaussians result on VolHuMe, view one.',
      },
      {
        src: '/assets/highlights/benchmarks/animatable2.jpg',
        alt: 'Animatable Gaussians result on VolHuMe, view two.',
      },
    ],
  },
];

const hideMissingMedia = (event: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
  event.currentTarget.classList.add('media-missing');
  event.currentTarget.parentElement?.setAttribute('data-media-missing', 'true');
};

function BrandName() {
  return <span className="brand-name">VolHuMe</span>;
}

function renderWithBrandName(text: string) {
  return (
    <>
      {text.split('VolHuMe').map((part, index, parts) => (
        <Fragment key={`${part}-${index}`}>
          {part}
          {index < parts.length - 1 ? <BrandName /> : null}
        </Fragment>
      ))}
    </>
  );
}

function BrandText({ text }: { text: string }) {
  return <>{renderWithBrandName(text)}</>;
}

function Reveal({ children, className = '', delay = 0, style, ...attributes }: RevealProps) {
  return (
    <div {...attributes} className={className} data-reveal style={{ ...style, transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function Counter({ value, suffix = '' }: Pick<Stat, 'value' | 'suffix'>) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplay(value);
      return undefined;
    }

    let frame = 0;
    let started = false;
    const duration = 1500;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        const startTime = performance.now();

        const tick = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(value * eased));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.6 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="VolHuMe home">
        <span className="brand-mark">V</span>
        <BrandName />
      </a>
      <button className="nav-toggle" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
        <span />
        <span />
      </button>
      <nav className={open ? 'is-open' : ''} aria-label="Primary navigation">
        {navItems.map(([label, id]) => (
          <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}

function Hero() {
  const [reduceHeroMotion, setReduceHeroMotion] = useState(false);
  const [heroVideoFailed, setHeroVideoFailed] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const legacyMotionQuery = motionQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };
    const updateMotionPreference = () => setReduceHeroMotion(motionQuery.matches);

    updateMotionPreference();
    if (typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', updateMotionPreference);
      return () => motionQuery.removeEventListener('change', updateMotionPreference);
    }

    if (typeof legacyMotionQuery.addListener === 'function') {
      legacyMotionQuery.addListener(updateMotionPreference);
      return () => {
        if (typeof legacyMotionQuery.removeListener === 'function') {
          legacyMotionQuery.removeListener(updateMotionPreference);
        }
      };
    }

    return undefined;
  }, []);

  return (
    <section className="hero section-band" id="top">
      <div
        className={`hero-media${heroVideoFailed ? ' is-video-unavailable' : ''}`}
        data-asset-label="Hero capture video"
        data-reveal
        style={{ transitionDelay: '160ms' }}
        aria-hidden="true"
      >
        {/* Hero video is rendered behind a translucent white veil; reduce overlay opacity if the video is too subtle. */}
        <div className="hero-video-clip">
          {!reduceHeroMotion ? (
            <video
              src={assetUrl(assetPaths.hero.heroVideo)}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onCanPlay={() => setHeroVideoFailed(false)}
              onError={() => setHeroVideoFailed(true)}
            />
          ) : null}
        </div>
        <div className="hero-fallback" />
        <div className="hero-video-overlay" />
      </div>
      <div className="hero-content">
        <Reveal className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={16} />
            high-resolution volumetric humans
          </div>
          <h1><BrandName /></h1>
          <p className="hero-title">A High-Resolution Large Scale Dataset of Volumetric Human Meshes</p>
          <div className="hero-actions">
            <a className="button primary" href="#access">
              <Download size={18} />
              Request access
            </a>
            <a className="button secondary" href={paperUrl} target="_blank" rel="noopener noreferrer">
              <FileText size={18} />
              Paper
            </a>
            <a className="button secondary coming-soon" href="#" title="Coming soon" aria-label="Code, coming soon">
              <Github size={18} />
              Code
            </a>
            <a className="button secondary" href="#overview">
              <Play size={18} />
              Explore dataset
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="stats-strip" aria-label="Key statistics">
      <div className="stat-grid">
        {stats.map((stat, index) => (
          <Reveal className="stat-card" key={stat.label} delay={index * 60}>
            <span className="stat-value">
              <Counter value={stat.value} suffix={stat.suffix} />
            </span>
            <span className="stat-label">{stat.label}</span>
            <p>{stat.detail}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Overview() {
  return (
    <section className="section overview-section" id="overview">
      <div className="overview-layout abstract-layout">
        <Reveal className="overview-copy abstract-copy">
          <span className="kicker">Abstract</span>
          <h2>Abstract</h2>
          <p className="abstract-intro">
            <BrandText text="We present VolHuMe, a high-resolution large-scale dataset of volumetric human meshes captured with a professional close-range volumetric studio. VolHuMe provides 104 subjects and 156K annotated frames with rich supervision for 4D human reconstruction, rendering, and avatar research." />
          </p>
          <ul className="abstract-bullets" aria-label="VolHuMe dataset contributions">
            {overviewBullets.map((item) => (
              <li className={`abstract-bullet abstract-bullet-${item.tone}`} key={item.label}>
                <span className="abstract-check" aria-hidden="true">
                  <Check size={15} strokeWidth={3} />
                </span>
                <span>
                  <strong>{item.label}</strong> <BrandText text={item.text} />
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal className="overview-video-card" delay={140} data-asset-label="Overview teaser video">
          <video
            className="overview-teaser-video"
            controls
            muted
            playsInline
            preload="metadata"
            poster={assetUrl(assetPaths.paper.overviewTeaser)}
            src={assetUrl(assetPaths.paper.overviewTeaserVideo)}
            aria-label="VolHuMe overview teaser video"
            onError={hideMissingMedia}
          />
        </Reveal>
      </div>
    </section>
  );
}

function DatasetContents() {
  return (
    <section className="section dataset" id="dataset">
      <div className="section-heading">
        <Reveal>
          <span className="kicker">Dataset Contents</span>
          <h2 className="dataset-title">
            <span>Everything Needed for</span>
            <span>4D Human Reconstruction</span>
          </h2>
        </Reveal>
      </div>
      <div className="contents-layout modality-only-layout">
        <Reveal className="viewer-frame actorshq-viewer-frame" data-asset-label="Modality viewer">
          <Suspense fallback={<div className="glb-viewer-fallback">Loading 3D sample...</div>}>
            <ModalityViewer />
          </Suspense>
        </Reveal>
      </div>
    </section>
  );
}

function DatasetHighlights() {
  const [selectedHighlight, setSelectedHighlight] = useState<{
    highlight: HighlightCard;
    imageIndex: number;
  } | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!selectedHighlight) return undefined;

    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedHighlight(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedHighlight]);

  return (
    <section className="section actors dataset-highlights" id="actors">
      <div className="section-heading">
        <Reveal>
          <span className="kicker">Dataset Highlights</span>
          <h2>Dataset Highlights</h2>
        </Reveal>
      </div>
      <div className="highlight-grid">
        {highlights.map((highlight, index) => (
          <Reveal className="highlight-card" key={highlight.id} delay={index * 90}>
            <HighlightCardCarousel
              highlight={highlight}
              onOpen={(imageIndex) => setSelectedHighlight({ highlight, imageIndex })}
            />
          </Reveal>
        ))}
      </div>
      {selectedHighlight ? (
        <div
          className="highlight-lightbox-backdrop"
          role="presentation"
          onClick={() => setSelectedHighlight(null)}
        >
          <div
            className="highlight-lightbox"
            role="dialog"
            aria-modal="true"
            aria-labelledby="highlight-lightbox-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              className="highlight-lightbox-close"
              type="button"
              onClick={() => setSelectedHighlight(null)}
              aria-label="Close highlight preview"
            >
              Close
            </button>
            <div>
              <span className="kicker">Dataset Highlight</span>
              <h3 id="highlight-lightbox-title">{selectedHighlight.highlight.title}</h3>
            </div>
            <div className="highlight-lightbox-image" data-asset-label={selectedHighlight.highlight.title}>
              <HighlightMedia
                alt={selectedHighlight.highlight.images[selectedHighlight.imageIndex]?.alt ?? selectedHighlight.highlight.title}
                fallbackLabel={selectedHighlight.highlight.title}
                source={selectedHighlight.highlight.images[selectedHighlight.imageIndex]?.src}
              />
              {selectedHighlight.highlight.images.length > 1 ? (
                <>
                  <button
                    className="highlight-arrow highlight-arrow-prev"
                    type="button"
                    onClick={() => {
                      setSelectedHighlight((current) => {
                        if (!current) return current;
                        const total = current.highlight.images.length;
                        return { ...current, imageIndex: (current.imageIndex - 1 + total) % total };
                      });
                    }}
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    className="highlight-arrow highlight-arrow-next"
                    type="button"
                    onClick={() => {
                      setSelectedHighlight((current) => {
                        if (!current) return current;
                        const total = current.highlight.images.length;
                        return { ...current, imageIndex: (current.imageIndex + 1) % total };
                      });
                    }}
                    aria-label="Next image"
                  >
                    ›
                  </button>
                  <span className="highlight-counter">
                    {selectedHighlight.imageIndex + 1} / {selectedHighlight.highlight.images.length}
                  </span>
                </>
              ) : null}
            </div>
            <p className="highlight-caption highlight-lightbox-caption">
              <HighlightText
                image={selectedHighlight.highlight.images[selectedHighlight.imageIndex]}
                fallback={selectedHighlight.highlight.text}
              />
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

type HighlightCardCarouselProps = {
  highlight: HighlightCard;
  onOpen: (imageIndex: number) => void;
};

function HighlightCardCarousel({ highlight, onOpen }: HighlightCardCarouselProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const total = highlight.images.length;
  const currentImage = highlight.images[imageIndex];

  useEffect(() => {
    setImageIndex(0);
  }, [highlight.id]);

  const showPrevious = () => {
    setImageIndex((current) => (current - 1 + total) % total);
  };

  const showNext = () => {
    setImageIndex((current) => (current + 1) % total);
  };

  return (
    <>
      <div className="highlight-copy">
        <h3>{highlight.title}</h3>
        <p>
          <HighlightText image={currentImage} fallback={highlight.text} />
        </p>
      </div>
      <div className="highlight-carousel">
        {currentImage ? (
          <button
            className="highlight-image-button"
            type="button"
            data-asset-label={highlight.title}
            onClick={() => onOpen(imageIndex)}
            aria-label="Open larger view"
          >
            <HighlightMedia
              alt={currentImage.alt}
              enableHoverPreview
              fallbackLabel={highlight.title}
              source={currentImage.src}
            />
          </button>
        ) : (
          <div className="highlight-image-button" data-asset-label={highlight.title}>
            <span className="highlight-placeholder">{highlight.placeholder ?? highlight.title}</span>
          </div>
        )}
        {total > 1 ? (
          <>
            <button className="highlight-arrow highlight-arrow-prev" type="button" onClick={showPrevious} aria-label="Previous image">
              ‹
            </button>
            <button className="highlight-arrow highlight-arrow-next" type="button" onClick={showNext} aria-label="Next image">
              ›
            </button>
            <span className="highlight-counter">
              {imageIndex + 1} / {total}
            </span>
          </>
        ) : null}
      </div>
    </>
  );
}

type HighlightTextProps = {
  fallback: string;
  image?: HighlightImage;
};

function HighlightText({ fallback, image }: HighlightTextProps) {
  if (!image?.caption && !image?.captionStrong) {
    return <BrandText text={fallback} />;
  }

  if (image.captionStrong && image.captionStrongPosition === 'before') {
    return (
      <>
        <strong>{renderWithBrandName(image.captionStrong)}</strong>
        <br />
        <BrandText text={image.caption ?? fallback} />
      </>
    );
  }

  if (image.captionStrong) {
    return (
      <>
        <BrandText text={image.caption ?? fallback} /> <strong>{renderWithBrandName(image.captionStrong)}</strong>
      </>
    );
  }

  return <BrandText text={image.caption ?? fallback} />;
}

type HighlightMediaProps = {
  alt: string;
  enableHoverPreview?: boolean;
  fallbackLabel: string;
  source?: string;
};

function HighlightMedia({ alt, enableHoverPreview = false, fallbackLabel, source }: HighlightMediaProps) {
  const [missing, setMissing] = useState(false);
  const resolvedSource = source ? assetUrl(source) : '';

  useEffect(() => {
    setMissing(false);
  }, [resolvedSource]);

  if (!resolvedSource || missing) {
    return <span className="highlight-placeholder">{fallbackLabel}</span>;
  }

  return (
    <>
      <img
        className="highlight-image-main"
        src={resolvedSource}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setMissing(true)}
      />
      {enableHoverPreview ? (
        <img
          aria-hidden="true"
          className="highlight-image-hover-preview"
          decoding="async"
          loading="lazy"
          src={resolvedSource}
          alt=""
          onError={() => setMissing(true)}
        />
      ) : null}
    </>
  );
}

function Benchmarks() {
  const [selectedBenchmark, setSelectedBenchmark] = useState<{
    benchmark: AssetCard;
    imageIndex: number;
  } | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!selectedBenchmark) return undefined;

    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedBenchmark(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedBenchmark]);

  return (
    <section className="section benchmarks" id="benchmarks">
      <div className="section-heading">
        <Reveal>
          <span className="kicker">Benchmarks</span>
          <h2>Evaluation Tracks for Reconstruction and Rendering</h2>
        </Reveal>
      </div>
      <div className="benchmark-grid">
        {benchmarks.map((benchmark, index) => (
          <BenchmarkCard
            benchmark={benchmark}
            index={index}
            key={benchmark.title}
            onOpen={(imageIndex) => setSelectedBenchmark({ benchmark, imageIndex })}
          />
        ))}
      </div>
      {selectedBenchmark ? (
        <div
          className="highlight-lightbox-backdrop"
          role="presentation"
          onClick={() => setSelectedBenchmark(null)}
        >
          <div
            className="highlight-lightbox"
            role="dialog"
            aria-modal="true"
            aria-labelledby="benchmark-lightbox-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              className="highlight-lightbox-close"
              type="button"
              onClick={() => setSelectedBenchmark(null)}
              aria-label="Close benchmark preview"
            >
              Close
            </button>
            <div>
              <span className="kicker">Evaluation Track</span>
              <h3 id="benchmark-lightbox-title">{selectedBenchmark.benchmark.title}</h3>
            </div>
            <div className="highlight-lightbox-image" data-asset-label={selectedBenchmark.benchmark.title}>
              <HighlightMedia
                alt={selectedBenchmark.benchmark.images[selectedBenchmark.imageIndex]?.alt ?? selectedBenchmark.benchmark.title}
                fallbackLabel={selectedBenchmark.benchmark.title}
                source={selectedBenchmark.benchmark.images[selectedBenchmark.imageIndex]?.src}
              />
              {selectedBenchmark.benchmark.images.length > 1 ? (
                <>
                  <button
                    className="highlight-arrow highlight-arrow-prev"
                    type="button"
                    onClick={() => {
                      setSelectedBenchmark((current) => {
                        if (!current) return current;
                        const total = current.benchmark.images.length;
                        return { ...current, imageIndex: (current.imageIndex - 1 + total) % total };
                      });
                    }}
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    className="highlight-arrow highlight-arrow-next"
                    type="button"
                    onClick={() => {
                      setSelectedBenchmark((current) => {
                        if (!current) return current;
                        const total = current.benchmark.images.length;
                        return { ...current, imageIndex: (current.imageIndex + 1) % total };
                      });
                    }}
                    aria-label="Next image"
                  >
                    ›
                  </button>
                  <span className="highlight-counter">
                    {selectedBenchmark.imageIndex + 1} / {selectedBenchmark.benchmark.images.length}
                  </span>
                </>
              ) : null}
            </div>
            <p className="highlight-caption highlight-lightbox-caption">
              <BrandText text={selectedBenchmark.benchmark.body} />
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

type BenchmarkCardProps = {
  benchmark: AssetCard;
  index: number;
  onOpen: (imageIndex: number) => void;
};

function BenchmarkCard({ benchmark, index, onOpen }: BenchmarkCardProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const currentImage = benchmark.images[imageIndex];
  const total = benchmark.images.length;

  const showPrevious = () => {
    setImageIndex((current) => (current - 1 + total) % total);
  };

  const showNext = () => {
    setImageIndex((current) => (current + 1) % total);
  };

  return (
    <Reveal
      className="benchmark-card interactive-card"
      data-asset-label={benchmark.title}
      delay={index * 100}
    >
      <div className="benchmark-media">
        {currentImage ? (
          <button
            className="highlight-image-button benchmark-image-button"
            type="button"
            data-asset-label={benchmark.title}
            onClick={() => onOpen(imageIndex)}
            aria-label="Open larger benchmark view"
          >
            <HighlightMedia
              alt={currentImage.alt}
              enableHoverPreview
              fallbackLabel={benchmark.title}
              source={currentImage.src}
            />
          </button>
        ) : (
          <span className="highlight-placeholder">{benchmark.title}</span>
        )}
        {total > 1 ? (
          <>
            <button className="benchmark-arrow benchmark-arrow-prev" type="button" onClick={showPrevious} aria-label="Previous image">
              ‹
            </button>
            <button className="benchmark-arrow benchmark-arrow-next" type="button" onClick={showNext} aria-label="Next image">
              ›
            </button>
            <span className="benchmark-counter">
              {imageIndex + 1} / {total}
            </span>
          </>
        ) : null}
      </div>
      <div>
        <h3>{benchmark.title}</h3>
        <p><BrandText text={benchmark.body} /></p>
      </div>
    </Reveal>
  );
}

function Access() {
  return (
    <section className="section access" id="access">
      <Reveal className="access-panel">
        <div>
          <span className="kicker">Access / Download</span>
          <h2 className="split-title">
            <span>Dataset access</span>
            <span>coming soon.</span>
          </h2>
        </div>
        <div className="access-actions">
          <a className="button primary" href={`mailto:${contactEmail}`}>
            <Mail size={18} />
            Contact authors
          </a>
        </div>
      </Reveal>
    </section>
  );
}

function Citation() {
  const [copied, setCopied] = useState(false);
  const citation = `@dataset{volhume2026,
  title  = {VolHuMe: A High-Resolution Large Scale Dataset of Volumetric Human Meshes},
  author={Martinelli, Giulia, and Bisagno, Niccol{\\\`o} and Garau, Nicola and Rahtu, Esa and Conci, Nicola},
  booktitle={2026 IEEE International Conference on Image Processing (ICIP)},
  year={2026},
  organization={IEEE}
}`;

  const copyCitation = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="section citation" id="citation">
      <div className="section-heading compact">
        <Reveal>
          <span className="kicker">Citation</span>
          <h2 className="split-title">
            <span className="citation-title-line">Cite <BrandName /></span>
            <span>in your research.</span>
          </h2>
        </Reveal>
      </div>
      <Reveal className="citation-box">
        <FileText size={22} />
        <button className="citation-copy" type="button" onClick={copyCitation}>
          {copied ? 'Copied' : 'Copy BibTeX'}
        </button>
        <pre>
          <code>{citation}</code>
        </pre>
      </Reveal>
    </section>
  );
}

type TeamMember = (typeof teamMembers)[number];
const teamRows = [teamMembers.slice(0, 3), teamMembers.slice(3)] as const;

function TeamMemberCard({ member }: { member: TeamMember }) {
  const [imageMissing, setImageMissing] = useState(false);
  const initials = member.name
    .split(' ')
    .map((part) => part[0])
    .join('');

  useEffect(() => {
    setImageMissing(false);
  }, [member.image]);

  return (
    <a className="team-member" href={member.url} target="_blank" rel="noopener noreferrer">
      <span className="team-avatar" aria-hidden="true">
        {!imageMissing ? (
          <img
            src={assetUrl(member.image)}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImageMissing(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </span>
      <span>{member.name}</span>
    </a>
  );
}

function TeamContact() {
  return (
    <footer className="section footer" id="contact">
      <Reveal className="team-section">
        <span className="kicker">Team / Contact</span>
        <h2>The <BrandName /> Team</h2>
        <div className="team-grid">
          {teamRows.map((row, index) => (
            <div className="team-row" key={`team-row-${index}`}>
              {row.map((member) => (
                <TeamMemberCard member={member} key={member.name} />
              ))}
            </div>
          ))}
        </div>
        <a className="back-to-top button secondary" href="#top" aria-label="Back to top">
          Back to top
        </a>
      </Reveal>
    </footer>
  );
}

export function App() {
  useRevealOnScroll();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <StatsSection />
        <Overview />
        <DatasetContents />
        <DatasetHighlights />
        <Benchmarks />
        <Access />
        <Citation />
      </main>
      <TeamContact />
    </>
  );
}
