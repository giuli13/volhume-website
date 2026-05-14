import {
  Aperture,
  BadgeCheck,
  Boxes,
  Braces,
  Camera,
  ChevronRight,
  Cloud,
  Cpu,
  Download,
  FileText,
  Fingerprint,
  Gauge,
  Github,
  Grid3X3,
  Hand,
  Layers3,
  Mail,
  Maximize2,
  Play,
  ScanFace,
  Sparkles,
  UserRoundSearch,
  Users,
  Video,
  Wand2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { assetPaths, assetUrl, subjectAssetPaths } from './data/assets';

type Stat = {
  label: string;
  value: number;
  suffix?: string;
  detail: string;
};

type AssetCard = {
  title: string;
  body: string;
  image: string;
};

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
} & React.HTMLAttributes<HTMLDivElement>;

const navItems = [
  ['Overview', 'overview'],
  ['Dataset', 'dataset'],
  ['Actors', 'actors'],
  ['System', 'capture'],
  ['Benchmarks', 'benchmarks'],
  ['Access', 'access'],
  ['Citation', 'citation'],
  ['Contact', 'contact'],
] as const;

const stats: Stat[] = [
  { label: 'Subjects', value: 104, detail: 'diverse identities, garments, motion styles' },
  { label: 'Annotated Frames', value: 156000, detail: 'temporally aligned volumetric captures' },
  { label: 'RGB Cameras', value: 64, detail: 'synchronized high-resolution color views' },
  { label: 'Depth Cameras', value: 32, detail: 'dense geometry support for reconstruction' },
  { label: 'Frame Rate', value: 25, suffix: ' fps', detail: 'sequence capture for 4D evaluation' },
  { label: 'Capture Volume', value: 3, suffix: ' m tall', detail: '2.5 m diameter calibrated stage' },
];

const contents = [
  {
    icon: Layers3,
    title: 'Textured Meshes',
    body: 'High-resolution surface reconstructions with cinematic-scale texture detail.',
  },
  {
    icon: Cloud,
    title: 'Dense Point Clouds',
    body: 'Frame-aligned point observations for geometry completion and estimation tasks.',
  },
  {
    icon: UserRoundSearch,
    title: 'SMPL-X Fittings',
    body: 'Parametric body, hand, and face alignment for controllable human modeling.',
  },
  {
    icon: Braces,
    title: 'Rigged Meshes',
    body: 'Animation-ready topology support for downstream avatars and motion pipelines.',
  },
  {
    icon: Grid3X3,
    title: 'Garment Segmentation',
    body: 'Semantic clothing labels designed for garment-aware human reconstruction.',
  },
  {
    icon: ScanFace,
    title: 'Hands and Face',
    body: 'Detailed local geometry for the regions that most often decide visual realism.',
  },
];

const tasks = [
  '4D reconstruction',
  'Point-cloud estimation',
  'Novel-view rendering',
  'Human avatar reconstruction',
];

const actorTags = ['motion', 'cloth', 'hands', 'expression', 'pose', 'layers', 'turntable', 'detail'];

const benchmarks: AssetCard[] = [
  {
    title: 'Novel-View Rendering',
    body: 'Multi-camera supervision for evaluating photorealistic synthesis under changing pose, garment, and expression.',
    image: assetPaths.paper.benchmarkView,
  },
  {
    title: '4D Human Reconstruction',
    body: 'Temporally coherent geometry sequences for measuring surface fidelity, stability, and detail preservation.',
    image: assetPaths.paper.benchmark4d,
  },
];

const hideMissingMedia = (event: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
  event.currentTarget.classList.add('media-missing');
  event.currentTarget.parentElement?.setAttribute('data-media-missing', 'true');
};

function useReveal() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.16 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
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

    let frame = 0;
    let started = false;
    const duration = 1300;

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
        <span>VolHuMe</span>
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
  return (
    <section className="hero section-band" id="top">
      <div className="hero-media" data-asset-label="Hero capture video" aria-hidden="true">
        <video
          src={assetUrl(assetPaths.hero.heroVideo)}
          autoPlay
          muted
          loop
          playsInline
          poster={assetUrl(assetPaths.hero.heroPoster)}
          onError={hideMissingMedia}
        />
        <div className="hero-fallback" />
      </div>
      <div className="hero-content">
        <Reveal className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={16} />
            high-resolution volumetric humans
          </div>
          <h1>VolHuMe</h1>
          <p className="hero-title">A High-Resolution Large Scale Dataset of Volumetric Human Meshes</p>
          <p className="hero-summary">
            A cinematic-scale capture resource for textured meshes, dense point clouds, SMPL-X fittings,
            rigged humans, garment segmentation, and detailed hand and facial geometry.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#access">
              <Download size={18} />
              Request access
            </a>
            <a className="button secondary" href="#overview">
              <Play size={18} />
              Explore dataset
            </a>
          </div>
        </Reveal>
        <Reveal className="hero-panel" delay={160}>
          <div>
            <span className="panel-label">Capture rig</span>
            <strong>64 RGB + 32 depth cameras</strong>
          </div>
          <div>
            <span className="panel-label">Stage</span>
            <strong>2.5 m diameter / 3 m height</strong>
          </div>
          <div>
            <span className="panel-label">Temporal rate</span>
            <strong>25 fps annotated sequences</strong>
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
    <section className="section" id="overview">
      <div className="section-heading">
        <Reveal>
          <span className="kicker">Abstract / Overview</span>
          <h2>Volumetric humans at dataset scale.</h2>
        </Reveal>
        <Reveal delay={100}>
          <p>
            VolHuMe captures 104 subjects inside a calibrated 2.5 m diameter, 3 m height volume using 64 RGB cameras
            and 32 depth cameras at 25 fps. The dataset contains 156,000 annotated frames and is designed for rigorous
            evaluation of dynamic human geometry, appearance, and avatar reconstruction pipelines.
          </p>
        </Reveal>
      </div>
      <div className="overview-layout">
        <Reveal className="image-frame" data-asset-label="Overview teaser">
          <img
            src={assetUrl(assetPaths.paper.overviewTeaser)}
            alt="VolHuMe overview teaser placeholder"
            onError={hideMissingMedia}
          />
        </Reveal>
        <Reveal className="overview-copy" delay={120}>
          <p>
            The release focuses on high-resolution textured meshes, dense point clouds, SMPL-X fittings, rigged meshes,
            garment segmentation, and detailed hand and facial geometry. It provides aligned signals across geometry,
            semantics, cameras, and time so methods can be compared under realistic motion and clothing variation.
          </p>
          <div className="task-pills">
            {tasks.map((task) => (
              <span key={task}>{task}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function WhyVolhume() {
  const reasons = [
    {
      icon: Maximize2,
      title: 'Large capture volume',
      body: 'A 2.5 m diameter and 3 m height stage supports full-body motion, layered garments, and broad pose variation.',
    },
    {
      icon: Aperture,
      title: 'Appearance and geometry',
      body: 'RGB and depth coverage are paired with textured surfaces and point observations for multi-signal learning.',
    },
    {
      icon: Fingerprint,
      title: 'Identity-level variation',
      body: '104 subjects enable study across body shape, apparel, expression, hands, and fine local detail.',
    },
    {
      icon: Gauge,
      title: 'Benchmark-ready',
      body: 'Annotations and task definitions are organized for reproducible 4D reconstruction and rendering comparisons.',
    },
  ];

  return (
    <section className="section why" id="why">
      <div className="section-heading compact">
        <Reveal>
          <span className="kicker">Why VolHuMe?</span>
          <h2>Built for methods that need the whole human signal.</h2>
        </Reveal>
      </div>
      <div className="reason-grid">
        {reasons.map((reason, index) => {
          const Icon = reason.icon;
          return (
            <Reveal className="interactive-card reason-card" key={reason.title} delay={index * 70}>
              <Icon size={26} />
              <h3>{reason.title}</h3>
              <p>{reason.body}</p>
            </Reveal>
          );
        })}
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
          <h2>Aligned assets for geometry, semantics, and avatars.</h2>
        </Reveal>
        <Reveal delay={100}>
          <p>
            VolHuMe is organized as a no-backend static release page now, with dataset access planned around documented
            asset groups, benchmark splits, and citation metadata.
          </p>
        </Reveal>
      </div>
      <div className="contents-layout">
        <Reveal className="image-frame tall" data-asset-label="Mesh closeups">
          <img src={assetUrl(assetPaths.paper.meshCloseups)} alt="Mesh closeups placeholder" onError={hideMissingMedia} />
        </Reveal>
        <div className="content-grid">
          {contents.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal className="interactive-card content-card" key={item.title} delay={index * 50}>
                <Icon size={24} />
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ActorGallery() {
  const actors = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        id: String(index + 1).padStart(2, '0'),
        image: subjectAssetPaths[index] ?? subjectAssetPaths[0],
        tag: actorTags[index],
      })),
    [],
  );

  return (
    <section className="section actors" id="actors">
      <div className="section-heading">
        <Reveal>
          <span className="kicker">Actor Gallery</span>
          <h2>Subject diversity for dynamic volumetric capture.</h2>
        </Reveal>
        <Reveal delay={100}>
          <p>
            The gallery layout is prepared for ActorsHQ-style subject previews, using placeholder stills until the
            official release imagery is added under public assets.
          </p>
        </Reveal>
      </div>
      <div className="actor-grid">
        {actors.map((actor, index) => (
          <Reveal className="actor-card" data-asset-label={`Subject ${actor.id}`} key={actor.id} delay={index * 45}>
            <img
              src={assetUrl(actor.image)}
              alt={`VolHuMe actor ${actor.id} placeholder`}
              onError={hideMissingMedia}
            />
            <div className="actor-meta">
              <span>subject {actor.id}</span>
              <strong>{actor.tag}</strong>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function CaptureSystem() {
  return (
    <section className="section capture" id="capture">
      <div className="section-heading compact">
        <Reveal>
          <span className="kicker">Capture System</span>
          <h2>A calibrated stage for dense multi-view humans.</h2>
        </Reveal>
      </div>
      <div className="system-grid">
        <Reveal className="system-visual">
          <div className="stage-rings" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="stage-core">
            <Users size={38} />
            <span>2.5 m diameter</span>
            <strong>3 m height</strong>
          </div>
        </Reveal>
        <div className="system-list">
          {[
            ['RGB array', '64 synchronized cameras capture high-resolution appearance from all sides.', Camera],
            ['Depth array', '32 depth cameras support dense surface recovery and point-cloud estimation.', Boxes],
            ['Temporal capture', '25 fps acquisition enables frame-level 4D reconstruction evaluation.', Video],
            ['Annotation stack', 'Meshes, fittings, segmentation, rigging, and local geometry are aligned.', BadgeCheck],
          ].map(([title, body, Icon], index) => (
            <Reveal className="system-item" key={title as string} delay={index * 80}>
              <Icon size={22} />
              <div>
                <h3>{title as string}</h3>
                <p>{body as string}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Benchmarks() {
  return (
    <section className="section benchmarks" id="benchmarks">
      <div className="section-heading">
        <Reveal>
          <span className="kicker">Benchmarks</span>
          <h2>Evaluation tracks for reconstruction and rendering.</h2>
        </Reveal>
        <Reveal delay={100}>
          <p>
            VolHuMe is prepared for benchmark tasks spanning 4D reconstruction, point-cloud estimation, novel-view
            rendering, and human avatar reconstruction.
          </p>
        </Reveal>
      </div>
      <div className="benchmark-grid">
        {benchmarks.map((benchmark, index) => (
          <Reveal
            className="benchmark-card interactive-card"
            data-asset-label={benchmark.title}
            key={benchmark.title}
            delay={index * 100}
          >
            <img src={assetUrl(benchmark.image)} alt={`${benchmark.title} placeholder`} onError={hideMissingMedia} />
            <div>
              <h3>{benchmark.title}</h3>
              <p>{benchmark.body}</p>
              <a href="#access">
                View protocol
                <ChevronRight size={16} />
              </a>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Access() {
  return (
    <section className="section access" id="access">
      <Reveal className="access-panel">
        <div>
          <span className="kicker">Access / Download</span>
          <h2>Dataset access coming soon.</h2>
          <p>
            This static page is ready for release details, download links, license text, and benchmark registration.
            Replace the placeholder buttons with the official access flow when the dataset is published.
          </p>
        </div>
        <div className="access-actions">
          <a className="button primary" href="mailto:contact@example.com">
            <Mail size={18} />
            Contact authors
          </a>
          <a className="button secondary" href="https://github.com/" target="_blank" rel="noreferrer">
            <Github size={18} />
            Project repository
          </a>
        </div>
      </Reveal>
    </section>
  );
}

function Citation() {
  const citation = `@dataset{volhume2026,
  title  = {VolHuMe: A High-Resolution Large Scale Dataset of Volumetric Human Meshes},
  author = {VolHuMe Team},
  year   = {2026},
  note   = {Dataset website}
}`;

  return (
    <section className="section citation" id="citation">
      <div className="section-heading compact">
        <Reveal>
          <span className="kicker">Citation</span>
          <h2>Reference VolHuMe in your research.</h2>
        </Reveal>
      </div>
      <Reveal className="citation-box">
        <FileText size={22} />
        <pre>
          <code>{citation}</code>
        </pre>
      </Reveal>
    </section>
  );
}

function TeamContact() {
  return (
    <footer className="section footer" id="contact">
      <Reveal className="footer-grid">
        <div>
          <span className="kicker">Team / Contact</span>
          <h2>VolHuMe Dataset Team</h2>
          <p>
            For access questions, benchmark protocols, or collaboration requests, replace this placeholder contact with
            the official project email and institutional affiliations.
          </p>
        </div>
        <div className="contact-card">
          <Cpu size={22} />
          <strong>Research dataset website</strong>
          <a href="mailto:contact@example.com">contact@example.com</a>
          <a href="#top">Back to top</a>
        </div>
      </Reveal>
    </footer>
  );
}

export function App() {
  useReveal();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <StatsSection />
        <Overview />
        <WhyVolhume />
        <DatasetContents />
        <ActorGallery />
        <CaptureSystem />
        <Benchmarks />
        <Access />
        <Citation />
      </main>
      <TeamContact />
    </>
  );
}
