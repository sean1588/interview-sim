import type { Lesson } from "../types";
import { forReact, reactCode, reactVariants } from "./shared";

export const compositionContextLessons: Lesson[] = [
  {
    id: "react-state-ownership-lifting",
    module: "composition-context",
    title: "State Ownership and Lifting",
    blurb: forReact(
      () =>
        "Place each stateful fact at one owner, derive the rest, and expose controlled APIs when ownership belongs above a component."
    ),
    content: forReact(
      (language) => `# State ownership is an architectural decision

React does not require all state to live at the top. It requires each **stateful fact** to have one authoritative owner. Put that owner at the lowest component that must coordinate every reader and writer of the fact. State used by one leaf stays local; state shared by siblings moves to their nearest common ancestor; state controlled by a route, form, or product workflow belongs there.

Duplicate state is the common failure mode. If a checkout stores both \`selectedShippingId\` and a copied \`selectedShippingMethod\`, either can become stale. Store the stable identifier and derive the object during render:

${reactCode(
  language,
  `function ShippingPicker({ methods, selectedId, onSelectedIdChange }) {
  const selected = methods.find((method) => method.id === selectedId) ?? null;

  return (
    <section>
      {methods.map((method) => (
        <ShippingOption
          key={method.id}
          method={method}
          selected={method.id === selectedId}
          onSelect={() => onSelectedIdChange(method.id)}
        />
      ))}
      <ShippingSummary method={selected} />
    </section>
  );
}`,
  `type ShippingMethod = {
  id: string;
  label: string;
  priceCents: number;
};

type ShippingPickerProps = {
  methods: ShippingMethod[];
  selectedId: string | null;
  onSelectedIdChange: (id: string) => void;
};

function ShippingPicker({
  methods,
  selectedId,
  onSelectedIdChange,
}: ShippingPickerProps) {
  const selected =
    methods.find((method) => method.id === selectedId) ?? null;

  return (
    <section>
      {methods.map((method) => (
        <ShippingOption
          key={method.id}
          method={method}
          selected={method.id === selectedId}
          onSelect={() => onSelectedIdChange(method.id)}
        />
      ))}
      <ShippingSummary method={selected} />
    </section>
  );
}`
)}

This is a single source of truth, not merely a single variable. The methods collection may come from one owner and the selected identifier from another, but there is only one stored answer to “which method is selected?”

## Lift coordination, not every implementation detail

Two panels that must behave like an accordion need one shared \`activeId\`. Each panel still owns details nobody else coordinates, such as a temporary hover affordance. Lifting exactly the coordination state keeps the contract small:

${reactCode(
  language,
  `function Accordion({ items }) {
  const [activeId, setActiveId] = useState(null);

  return items.map((item) => (
    <Panel
      key={item.id}
      expanded={item.id === activeId}
      onExpandedChange={(expanded) => {
        setActiveId(expanded ? item.id : null);
      }}
    >
      {item.content}
    </Panel>
  ));
}

function Panel({ expanded, onExpandedChange, children }) {
  return (
    <article>
      <button onClick={() => onExpandedChange(!expanded)}>
        {expanded ? "Collapse" : "Expand"}
      </button>
      {expanded && children}
    </article>
  );
}`,
  `type AccordionItem = {
  id: string;
  content: React.ReactNode;
};

type PanelProps = {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  children: React.ReactNode;
};

function Accordion({ items }: { items: AccordionItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return items.map((item) => (
    <Panel
      key={item.id}
      expanded={item.id === activeId}
      onExpandedChange={(expanded) => {
        setActiveId(expanded ? item.id : null);
      }}
    >
      {item.content}
    </Panel>
  ));
}

function Panel({ expanded, onExpandedChange, children }: PanelProps) {
  return (
    <article>
      <button onClick={() => onExpandedChange(!expanded)}>
        {expanded ? "Collapse" : "Expand"}
      </button>
      {expanded && children}
    </article>
  );
}`
)}

\`Panel\` is controlled: its current value arrives as \`expanded\`, and it requests a change through \`onExpandedChange\`. “Controlled” describes ownership, not whether a form element is involved. Tables, dialogs, tabs, pagination, and selection models use the same value/callback contract.

## Do not synchronize two owners

An Effect that copies a prop into state creates a second owner:

${reactCode(
  language,
  `function ProfileEditor({ profile }) {
  const [name, setName] = useState(profile.name);

  // Avoid: every profile update now needs a conflict policy.
  useEffect(() => setName(profile.name), [profile]);
}`,
  `function ProfileEditor({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name);

  // Avoid: every profile update now needs a conflict policy.
  useEffect(() => setName(profile.name), [profile]);
}`
)}

Sometimes the product genuinely has two facts: a server value and an in-progress draft. Name both, define when the draft starts and commits, and reset identity deliberately—often by rendering the editor with \`key={profile.id}\`. Do not disguise that policy as synchronization.

Practical ownership checks:

- If removing a stored field still lets render calculate it cheaply, derive it.
- Store stable IDs rather than copied records when collections can refresh.
- Lift state only as far as all coordinated consumers require.
- Pass values down and intent callbacks up; keep mutation policy at the owner.
- Preserve or reset state intentionally through component position and keys.
- Treat controlled callbacks as requests: the parent may validate, defer, or reject them.`,
    ),
    exercises: [
      {
        id: "react-state-ownership-selection-model",
        title: forReact(() => "Model one-owner selection"),
        instructions: forReact(
          () =>
            `Complete the pure selection transition used by a controlled accordion. \`toggleSelection(selectedId, requestedId)\` returns \`null\` when the requested item is already selected; otherwise it returns the requested ID. Do not store one Boolean per panel.

This exercise models the state contract without React runtime code. Expected output:

\`\`\`
beta
null
alpha
\`\`\``
        ),
        starterCode: reactVariants(
          `function toggleSelection(selectedId, requestedId) {
  // TODO: return the next single source of truth.
}

let selectedId = null;
selectedId = toggleSelection(selectedId, "beta");
console.log(selectedId); // expected: beta
selectedId = toggleSelection(selectedId, "beta");
console.log(selectedId); // expected: null
selectedId = toggleSelection(selectedId, "alpha");
console.log(selectedId); // expected: alpha`,
          `function toggleSelection(
  selectedId: string | null,
  requestedId: string
): string | null {
  // TODO: return the next single source of truth.
  return selectedId;
}

let selectedId: string | null = null;
selectedId = toggleSelection(selectedId, "beta");
console.log(selectedId); // expected: beta
selectedId = toggleSelection(selectedId, "beta");
console.log(selectedId); // expected: null
selectedId = toggleSelection(selectedId, "alpha");
console.log(selectedId); // expected: alpha`
        ),
      },
      {
        id: "react-state-ownership-derived-record",
        title: forReact(() => "Derive a record from authoritative state"),
        instructions: forReact(
          () =>
            `Implement \`selectCurrent(methods, selectedId)\`. Return the matching record or \`null\`; do not copy a selected record into a second state variable. The refreshed collection demonstrates why the ID is the durable fact.

Expected output:

\`\`\`
Express
Express tomorrow
null
\`\`\``
        ),
        starterCode: reactVariants(
          `function selectCurrent(methods, selectedId) {
  // TODO: derive the current record from methods and selectedId.
}

const first = [
  { id: "standard", label: "Standard" },
  { id: "express", label: "Express" },
];
const refreshed = [
  { id: "standard", label: "Standard" },
  { id: "express", label: "Express tomorrow" },
];

console.log(selectCurrent(first, "express")?.label); // expected: Express
console.log(selectCurrent(refreshed, "express")?.label); // expected: Express tomorrow
console.log(selectCurrent(refreshed, "missing")); // expected: null`,
          `type Method = { id: string; label: string };

function selectCurrent(
  methods: Method[],
  selectedId: string | null
): Method | null {
  // TODO: derive the current record from methods and selectedId.
  return null;
}

const first: Method[] = [
  { id: "standard", label: "Standard" },
  { id: "express", label: "Express" },
];
const refreshed: Method[] = [
  { id: "standard", label: "Standard" },
  { id: "express", label: "Express tomorrow" },
];

console.log(selectCurrent(first, "express")?.label); // expected: Express
console.log(selectCurrent(refreshed, "express")?.label); // expected: Express tomorrow
console.log(selectCurrent(refreshed, "missing")); // expected: null`
        ),
      },
    ],
    quiz: [
      {
        id: "react-state-ownership-lifting-q1",
        prompt: forReact(
          () =>
            "A product list refreshes records while a sibling summary shows the selected product. Which state shape gives the clearest single source of truth?"
        ),
        options: forReact(() => [
          "Store the selected product ID once and derive the current record from the latest list",
          "Store a selected Boolean independently inside every product row",
          "Store both the selected ID and a copied selected record, then reconcile them in an Effect",
          "Move the complete list and every row interaction into application-wide context",
        ]),
        answer: 0,
        explanation: forReact(
          () =>
            "The identifier is the durable selection fact. Deriving the record from the current collection prevents a copied record from becoming stale."
        ),
      },
      {
        id: "react-state-ownership-lifting-q2",
        prompt: forReact(
          () =>
            "Two sibling panels must guarantee that at most one is expanded. Where should the active panel ID live?"
        ),
        options: forReact(() => [
          "In both panels, with callbacks that attempt to keep their local state synchronized",
          "In their nearest common owner, passed down as controlled values and intent callbacks",
          "In whichever panel renders first, exposed to the sibling through a ref",
          "At the application root regardless of whether any other subtree needs it",
        ]),
        answer: 1,
        explanation: forReact(
          () =>
            "The nearest common owner can enforce the shared invariant. Unrelated local details can remain inside each panel."
        ),
      },
      {
        id: "react-state-ownership-lifting-q3",
        prompt: forReact(
          () =>
            "When is initializing local state from a prop a sound model rather than accidental duplication?"
        ),
        options: forReact(() => [
          "Whenever an Effect immediately copies every later prop change into local state",
          "Whenever the prop is an object, because objects cannot be controlled",
          "When the local value is an explicitly modeled draft with defined reset and commit semantics",
          "Only when the parent never renders again",
        ]),
        answer: 2,
        explanation: forReact(
          () =>
            "A draft and a committed value are legitimately different facts. Their names and lifecycle must make the conflict policy explicit."
        ),
      },
    ],
  },
  {
    id: "react-context-as-dependency",
    module: "composition-context",
    title: "Context as Dependency Injection",
    blurb: forReact(
      () =>
        "Use context to inject stable capabilities and scoped configuration, with deliberate provider boundaries and value identity."
    ),
    content: forReact(
      (language) => `# Context supplies a dependency to a subtree

Context is best understood as dependency injection through the component tree. A provider chooses an implementation or scoped value; descendants declare that dependency with \`use\`. This is useful for a theme, locale, authenticated principal, router capability, feature policy, or a domain service shared by one feature subtree.

It is not a reason to combine unrelated changing values into a “global state” object. Context answers **where a dependency comes from**. It does not supply selectors, transactions, normalization, persistence, or fine-grained subscriptions.

In React 19.2, the context object itself can be rendered as the provider:

${reactCode(
  language,
  `const AnalyticsContext = createContext(null);

function useAnalytics() {
  const analytics = use(AnalyticsContext);
  if (analytics === null) {
    throw new Error("useAnalytics must be used within AnalyticsContext");
  }
  return analytics;
}

function Checkout({ analytics, children }) {
  return (
    <AnalyticsContext value={analytics}>
      {children}
    </AnalyticsContext>
  );
}

function PayButton() {
  const analytics = useAnalytics();

  function handleClick() {
    analytics.track("checkout_pay_requested");
  }

  return <button onClick={handleClick}>Pay</button>;
}`,
  `type Analytics = {
  track(event: string): void;
};

const AnalyticsContext = createContext<Analytics | null>(null);

function useAnalytics(): Analytics {
  const analytics = use(AnalyticsContext);
  if (analytics === null) {
    throw new Error("useAnalytics must be used within AnalyticsContext");
  }
  return analytics;
}

function Checkout({
  analytics,
  children,
}: {
  analytics: Analytics;
  children: React.ReactNode;
}) {
  return (
    <AnalyticsContext value={analytics}>
      {children}
    </AnalyticsContext>
  );
}

function PayButton() {
  const analytics = useAnalytics();

  function handleClick() {
    analytics.track("checkout_pay_requested");
  }

  return <button onClick={handleClick}>Pay</button>;
}`
)}

The \`null\` default plus strict custom Hook makes a missing provider fail near the consumer. Use a meaningful default only when “no provider” is a valid implementation, such as a no-op telemetry adapter. In tests or previews, inject a fake dependency through the same provider instead of mocking module state.

## Provider placement defines scope and lifetime

Place a provider at the narrowest stable boundary that owns the dependency. A billing service belongs around billing routes, not automatically around the entire app. Narrow providers:

- make dependencies visible in composition,
- allow two subtrees to receive different values,
- avoid waking consumers outside the feature,
- tie stateful provider lifetime to the intended boundary.

Moving a provider or changing its \`key\` can reset state below it. Conversely, putting it too high can preserve state across workflows that should start clean. Nested providers are useful overrides: an admin subtree can inject stricter permissions or a preview can inject a different clock.

## Value identity is part of the update contract

Every context consumer below a provider is eligible to render when the provider's \`value\` is not \`Object.is\`-equal to the previous value. A fresh object and fresh function on every parent render therefore broadcast an update:

${reactCode(
  language,
  `function PreferencesProvider({ children }) {
  const [density, setDensity] = useState("comfortable");

  const setCompact = useCallback(() => setDensity("compact"), []);
  const value = useMemo(
    () => ({ density, setCompact }),
    [density, setCompact]
  );

  return (
    <PreferencesContext value={value}>
      {children}
    </PreferencesContext>
  );
}`,
  `type Density = "comfortable" | "compact";
type PreferencesValue = {
  density: Density;
  setCompact(): void;
};

function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensity] = useState<Density>("comfortable");

  const setCompact = useCallback(() => setDensity("compact"), []);
  const value = useMemo<PreferencesValue>(
    () => ({ density, setCompact }),
    [density, setCompact]
  );

  return (
    <PreferencesContext value={value}>
      {children}
    </PreferencesContext>
  );
}`
)}

Memoization is useful only if the provider has unrelated rerenders and consumers care about avoiding those broadcasts. It cannot stop the broadcast when \`density\` actually changes. Often a better boundary is to split values by change rate and consumer set—for example, \`SessionContext\` and \`PermissionsContext\` rather than one application object.

Passing children through a provider also matters. A provider component can receive stable \`children\` from its parent so its own state update does not recreate the whole subtree; only actual context consumers observe the context update.

## Prefer explicit props until distance becomes the problem

Props make dataflow and reuse obvious. Component composition can avoid “prop drilling” when an intermediate component only forwards UI: pass a ready-made child or slot. Reach for context when many descendants at varying depths need the same scoped dependency, or when consumers must not know which ancestor implements it.

A practical context review asks:

1. Is this one coherent dependency or a bag of unrelated state?
2. Which subtree should be able to consume it, and how long should it live?
3. Is absence valid, or should a strict Hook throw?
4. Which members change, and should values be split by update pattern?
5. Can a prop or composed child keep the contract more explicit?`,
    ),
    exercises: [
      {
        id: "react-context-layered-configuration",
        title: forReact(() => "Model nested provider overrides"),
        instructions: forReact(
          () =>
            `Implement the pure \`resolvePolicy(parent, override)\` model. An override may replace only the supplied fields; unspecified fields inherit from the parent. Return a new complete policy without mutating either input.

This mirrors narrowly scoped nested context providers. Expected output:

\`\`\`
eu:light
eu:dark
us:dark
\`\`\``
        ),
        starterCode: reactVariants(
          `function resolvePolicy(parent, override) {
  // TODO: combine the parent policy with this subtree's override.
}

const root = { region: "eu", theme: "light" };
const darkArea = resolvePolicy(root, { theme: "dark" });
const usArea = resolvePolicy(darkArea, { region: "us" });

console.log(root.region + ":" + root.theme); // expected: eu:light
console.log(darkArea.region + ":" + darkArea.theme); // expected: eu:dark
console.log(usArea.region + ":" + usArea.theme); // expected: us:dark`,
          `type Policy = {
  region: "eu" | "us";
  theme: "light" | "dark";
};

function resolvePolicy(
  parent: Policy,
  override: Partial<Policy>
): Policy {
  // TODO: combine the parent policy with this subtree's override.
  return parent;
}

const root: Policy = { region: "eu", theme: "light" };
const darkArea = resolvePolicy(root, { theme: "dark" });
const usArea = resolvePolicy(darkArea, { region: "us" });

console.log(root.region + ":" + root.theme); // expected: eu:light
console.log(darkArea.region + ":" + darkArea.theme); // expected: eu:dark
console.log(usArea.region + ":" + usArea.theme); // expected: us:dark`
        ),
      },
      {
        id: "react-context-value-identity-model",
        title: forReact(() => "Preserve provider value identity"),
        instructions: forReact(
          () =>
            `Complete \`nextContextValue(previous, density, setDensity)\`. Reuse \`previous\` only when both dependencies are identical; otherwise return a new value. This models the identity contract supplied by a correctly dependency-keyed memo.

Expected output:

\`\`\`
true
false
compact
\`\`\``
        ),
        starterCode: reactVariants(
          `function nextContextValue(previous, density, setDensity) {
  // TODO: reuse previous only when all represented dependencies match.
}

const setDensity = (value) => value;
const first = nextContextValue(null, "comfortable", setDensity);
const same = nextContextValue(first, "comfortable", setDensity);
const changed = nextContextValue(same, "compact", setDensity);

console.log(first === same); // expected: true
console.log(same === changed); // expected: false
console.log(changed.density); // expected: compact`,
          `type Density = "comfortable" | "compact";
type SetDensity = (value: Density) => Density;
type ContextValue = {
  density: Density;
  setDensity: SetDensity;
};

function nextContextValue(
  previous: ContextValue | null,
  density: Density,
  setDensity: SetDensity
): ContextValue {
  // TODO: reuse previous only when all represented dependencies match.
  return { density, setDensity };
}

const setDensity: SetDensity = (value) => value;
const first = nextContextValue(null, "comfortable", setDensity);
const same = nextContextValue(first, "comfortable", setDensity);
const changed = nextContextValue(same, "compact", setDensity);

console.log(first === same); // expected: true
console.log(same === changed); // expected: false
console.log(changed.density); // expected: compact`
        ),
      },
    ],
    quiz: [
      {
        id: "react-context-as-dependency-q1",
        prompt: forReact(
          () =>
            "Which description best captures a well-designed React context?"
        ),
        options: forReact(() => [
          "A replacement for component props in every reusable component",
          "A global object that combines all changing application state",
          "A mechanism that prevents consumers from rendering when values change",
          "A scoped dependency whose provider selects the value or implementation for a subtree",
        ]),
        answer: 3,
        explanation: forReact(
          () =>
            "Context injects a value through a tree boundary. It does not by itself provide the capabilities of a state store."
        ),
      },
      {
        id: "react-context-as-dependency-q2",
        prompt: forReact(
          () =>
            "Why can an inline object passed as a provider value be costly?"
        ),
        options: forReact(() => [
          "Its new identity can broadcast to context consumers on every provider render",
          "React serializes every object value before delivering it",
          "Inline objects force the provider subtree to remount",
          "Context only accepts primitive values in production builds",
        ]),
        answer: 0,
        explanation: forReact(
          () =>
            "Context compares provider values with Object.is. A fresh object differs even when its fields are equal."
        ),
      },
      {
        id: "react-context-as-dependency-q3",
        prompt: forReact(
          () =>
            "Where should a billing-specific service provider usually be placed?"
        ),
        options: forReact(() => [
          "Inside every leaf that calls the service, creating one service per consumer",
          "At the narrowest stable billing boundary that contains all intended consumers",
          "At the application root because every context is inherently global",
          "Outside React in mutable module state so provider identity is irrelevant",
        ]),
        answer: 1,
        explanation: forReact(
          () =>
            "A narrow stable provider documents scope, controls lifetime, permits overrides, and limits unrelated consumers."
        ),
      },
    ],
  },
  {
    id: "react-reducer-context-architecture",
    module: "composition-context",
    title: "Reducer and Context Architecture",
    blurb: forReact(
      () =>
        "Centralize domain transitions in a pure reducer, inject state and dispatch separately, and understand context selector limits."
    ),
    content: forReact(
      (language) => `# Reducers centralize transitions, not storage for its own sake

A reducer is useful when several events update related fields under shared invariants. It gives those transitions names, keeps event handlers declarative, and makes the state machine testable without rendering. It is not automatically better than several independent \`useState\` calls.

For a cart, events express domain intent while the reducer owns quantity rules:

${reactCode(
  language,
  `const initialCart = { lines: {}, coupon: null };

function cartReducer(state, action) {
  switch (action.type) {
    case "item-added": {
      const quantity = (state.lines[action.productId] ?? 0) + 1;
      return {
        ...state,
        lines: { ...state.lines, [action.productId]: quantity },
      };
    }
    case "quantity-changed": {
      const lines = { ...state.lines };
      if (action.quantity <= 0) {
        delete lines[action.productId];
      } else {
        lines[action.productId] = action.quantity;
      }
      return { ...state, lines };
    }
    case "coupon-applied":
      return { ...state, coupon: action.code };
    default:
      throw new Error("Unknown cart action");
  }
}`,
  `type CartState = {
  lines: Record<string, number>;
  coupon: string | null;
};

type CartAction =
  | { type: "item-added"; productId: string }
  | { type: "quantity-changed"; productId: string; quantity: number }
  | { type: "coupon-applied"; code: string };

const initialCart: CartState = { lines: {}, coupon: null };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "item-added": {
      const quantity = (state.lines[action.productId] ?? 0) + 1;
      return {
        ...state,
        lines: { ...state.lines, [action.productId]: quantity },
      };
    }
    case "quantity-changed": {
      const lines = { ...state.lines };
      if (action.quantity <= 0) {
        delete lines[action.productId];
      } else {
        lines[action.productId] = action.quantity;
      }
      return { ...state, lines };
    }
    case "coupon-applied":
      return { ...state, coupon: action.code };
  }
}`
)}

Keep reducers pure: no requests, timers, storage writes, analytics, random IDs, or mutation of existing state. Event handlers perform external work and dispatch facts or intents. Returning the previous object for a true no-op is useful because identity communicates that nothing changed.

## Split state from dispatch

A feature provider can combine \`useReducer\` with two contexts:

${reactCode(
  language,
  `const CartStateContext = createContext(null);
const CartDispatchContext = createContext(null);

function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialCart);

  return (
    <CartStateContext value={state}>
      <CartDispatchContext value={dispatch}>
        {children}
      </CartDispatchContext>
    </CartStateContext>
  );
}

function useCartState() {
  const state = use(CartStateContext);
  if (state === null) throw new Error("Missing CartProvider");
  return state;
}

function useCartDispatch() {
  const dispatch = use(CartDispatchContext);
  if (dispatch === null) throw new Error("Missing CartProvider");
  return dispatch;
}`,
  `type CartDispatch = React.Dispatch<CartAction>;

const CartStateContext = createContext<CartState | null>(null);
const CartDispatchContext = createContext<CartDispatch | null>(null);

function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCart);

  return (
    <CartStateContext value={state}>
      <CartDispatchContext value={dispatch}>
        {children}
      </CartDispatchContext>
    </CartStateContext>
  );
}

function useCartState(): CartState {
  const state = use(CartStateContext);
  if (state === null) throw new Error("Missing CartProvider");
  return state;
}

function useCartDispatch(): CartDispatch {
  const dispatch = use(CartDispatchContext);
  if (dispatch === null) throw new Error("Missing CartProvider");
  return dispatch;
}`
)}

\`dispatch\` has stable identity. A component that only dispatches can consume the dispatch context and avoid state-driven context updates. Splitting also makes capability boundaries explicit: some components issue commands without reading the whole model.

Custom Hooks should expose domain-level operations where that improves call sites:

${reactCode(
  language,
  `function useAddCartItem() {
  const dispatch = useCartDispatch();
  return useCallback(
    (productId) => dispatch({ type: "item-added", productId }),
    [dispatch]
  );
}`,
  `function useAddCartItem(): (productId: string) => void {
  const dispatch = useCartDispatch();
  return useCallback(
    (productId: string) => dispatch({ type: "item-added", productId }),
    [dispatch]
  );
}`
)}

Do not hide every action behind ceremonial wrappers. A discriminated action can itself be a clear public feature contract.

## Selector Hooks do not make context selective

A Hook such as \`useCartTotal()\` improves encapsulation and keeps derivation in one place. With ordinary context, however, it still reads the complete state context. When any state value changes, every consumer of that context is eligible to render before selecting its slice. \`useMemo\` may cache an expensive calculation; it does not turn context into field-level subscriptions.

Use increasingly specialized tools as needed:

- For modest feature state, one state context plus one dispatch context is often enough.
- Split independent domains or state with very different update rates into separate providers.
- Pass a hot value as a prop to a narrow subtree when that is clearer.
- For large or high-frequency stores requiring per-slice subscriptions, use an external store interface designed around \`useSyncExternalStore\` or a store library with selectors.

Measure before fragmenting context. Provider complexity has a maintenance cost, and many feature trees are small enough that broad context notification is irrelevant.

## Reducer-provider lifecycle

The provider owns initialization and reset. Initialize expensive state with the third \`useReducer\` argument, and dispatch an explicit reset event when reset is a domain transition. Use a changed provider \`key\` when the entire feature instance should be replaced—for example, switching from cart A to cart B with no continuity.

The architecture has three separable pieces: a pure transition function, a state owner, and an injection boundary. Keeping those pieces separate makes reducer tests fast and provider placement intentional.`,
    ),
    exercises: [
      {
        id: "react-reducer-cart-transitions",
        title: forReact(() => "Implement immutable cart transitions"),
        instructions: forReact(
          () =>
            `Complete the pure reducer. \`item-added\` increments a line. \`quantity-changed\` replaces the quantity, removing the line when the requested quantity is zero or less. Preserve unrelated lines and do not mutate prior states.

Expected output:

\`\`\`
2
true
false
\`\`\``
        ),
        starterCode: reactVariants(
          `const initialState = { lines: {} };

function cartReducer(state, action) {
  // TODO: handle item-added and quantity-changed immutably.
  return state;
}

const one = cartReducer(initialState, {
  type: "item-added",
  productId: "book",
});
const two = cartReducer(one, {
  type: "item-added",
  productId: "book",
});
const removed = cartReducer(two, {
  type: "quantity-changed",
  productId: "book",
  quantity: 0,
});

console.log(two.lines.book); // expected: 2
console.log(initialState.lines.book === undefined); // expected: true
console.log("book" in removed.lines); // expected: false`,
          `type CartState = { lines: Record<string, number> };
type CartAction =
  | { type: "item-added"; productId: string }
  | {
      type: "quantity-changed";
      productId: string;
      quantity: number;
    };

const initialState: CartState = { lines: {} };

function cartReducer(state: CartState, action: CartAction): CartState {
  // TODO: handle item-added and quantity-changed immutably.
  return state;
}

const one = cartReducer(initialState, {
  type: "item-added",
  productId: "book",
});
const two = cartReducer(one, {
  type: "item-added",
  productId: "book",
});
const removed = cartReducer(two, {
  type: "quantity-changed",
  productId: "book",
  quantity: 0,
});

console.log(two.lines.book); // expected: 2
console.log(initialState.lines.book === undefined); // expected: true
console.log("book" in removed.lines); // expected: false`
        ),
      },
      {
        id: "react-reducer-no-op-identity",
        title: forReact(() => "Preserve identity for reducer no-ops"),
        instructions: forReact(
          () =>
            `Complete the notification reducer. \`marked-read\` returns the original state object when the ID is missing or already read. Otherwise, update only the matching record without mutating the prior state.

Expected output:

\`\`\`
true
false
true
\`\`\``
        ),
        starterCode: reactVariants(
          `function notificationsReducer(state, action) {
  // TODO: implement marked-read and preserve identity for true no-ops.
  return state;
}

const start = [
  { id: "a", read: false },
  { id: "b", read: true },
];
const missing = notificationsReducer(start, {
  type: "marked-read",
  id: "z",
});
const changed = notificationsReducer(start, {
  type: "marked-read",
  id: "a",
});
const alreadyRead = notificationsReducer(changed, {
  type: "marked-read",
  id: "a",
});

console.log(missing === start); // expected: true
console.log(changed === start); // expected: false
console.log(alreadyRead === changed); // expected: true`,
          `type NoticeRecord = { id: string; read: boolean };
type NotificationAction = { type: "marked-read"; id: string };

function notificationsReducer(
  state: NoticeRecord[],
  action: NotificationAction
): NoticeRecord[] {
  // TODO: implement marked-read and preserve identity for true no-ops.
  return state;
}

const start: NoticeRecord[] = [
  { id: "a", read: false },
  { id: "b", read: true },
];
const missing = notificationsReducer(start, {
  type: "marked-read",
  id: "z",
});
const changed = notificationsReducer(start, {
  type: "marked-read",
  id: "a",
});
const alreadyRead = notificationsReducer(changed, {
  type: "marked-read",
  id: "a",
});

console.log(missing === start); // expected: true
console.log(changed === start); // expected: false
console.log(alreadyRead === changed); // expected: true`
        ),
      },
    ],
    quiz: [
      {
        id: "react-reducer-context-architecture-q1",
        prompt: forReact(
          () =>
            "What is the main rendering benefit of splitting reducer state and dispatch into separate contexts?"
        ),
        options: forReact(() => [
          "The state context begins supporting field-level selector subscriptions",
          "The reducer can safely perform requests because dispatch is isolated",
          "Dispatch-only consumers need not subscribe to changing state context values",
          "State updates become synchronous across every React priority",
        ]),
        answer: 2,
        explanation: forReact(
          () =>
            "Reducer dispatch is stable. Consumers that only issue actions can read the dispatch context without reading changing state."
        ),
      },
      {
        id: "react-reducer-context-architecture-q2",
        prompt: forReact(
          () =>
            "A custom Hook reads the complete state context and returns only `state.total`. What selector behavior does this provide?"
        ),
        options: forReact(() => [
          "React subscribes the component only to the total field",
          "React skips the component whenever the selected total is unchanged",
          "The Hook converts context into useSyncExternalStore automatically",
          "It encapsulates derivation, but ordinary context still notifies the consumer for any state value change",
        ]),
        answer: 3,
        explanation: forReact(
          () =>
            "Selector-shaped Hooks are good APIs, but ordinary context has no per-field subscription mechanism."
        ),
      },
      {
        id: "react-reducer-context-architecture-q3",
        prompt: forReact(
          () =>
            "Which operation belongs inside a reducer?"
        ),
        options: forReact(() => [
          "Applying a domain event to previous state and returning the next immutable state",
          "Sending analytics after an item is added",
          "Persisting the new cart to a remote service",
          "Generating a random identifier from ambient state",
        ]),
        answer: 0,
        explanation: forReact(
          () =>
            "Reducers must be pure and deterministic. External work belongs around dispatch, while the reducer computes transitions."
        ),
      },
    ],
  },
  {
    id: "react-component-api-patterns",
    module: "composition-context",
    title: "Component API Patterns",
    blurb: forReact(
      () =>
        "Design composable UI contracts with children and slots, deliberate ownership modes, compound components, and headless behavior."
    ),
    content: forReact(
      (language) => `# Component APIs should encode valid composition

A component API is a boundary between teams and between future versions of the same feature. Prefer contracts that reveal structure and ownership. Avoid APIs where interacting Boolean props create dozens of undocumented states.

## Children and named slots

\`children\` is the simplest slot. The parent component owns framing while callers own nested content. Named node props work when the layout has several semantic insertion points:

${reactCode(
  language,
  `function Card({ header, actions, children }) {
  return (
    <article className="card">
      <header>{header}</header>
      <div className="card-body">{children}</div>
      {actions && <footer>{actions}</footer>}
    </article>
  );
}

function AccountCard({ account }) {
  return (
    <Card
      header={<AccountHeading account={account} />}
      actions={<AccountActions accountId={account.id} />}
    >
      <AccountSummary account={account} />
    </Card>
  );
}`,
  `type CardProps = {
  header: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

function Card({ header, actions, children }: CardProps) {
  return (
    <article className="card">
      <header>{header}</header>
      <div className="card-body">{children}</div>
      {actions && <footer>{actions}</footer>}
    </article>
  );
}

function AccountCard({ account }: { account: Account }) {
  return (
    <Card
      header={<AccountHeading account={account} />}
      actions={<AccountActions accountId={account.id} />}
    >
      <AccountSummary account={account} />
    </Card>
  );
}`
)}

Passing elements rather than configuration objects lets the caller compose capabilities directly. Use data props when the component truly owns rendering a repeated domain shape; use slots when callers need meaningful visual or behavioral variation.

## Controlled and uncontrolled ownership

A reusable component may support either parent ownership or internal ownership:

${reactCode(
  language,
  `function Disclosure({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : uncontrolledOpen;

  function requestOpen(nextOpen) {
    if (!controlled) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  return (
    <section>
      <button onClick={() => requestOpen(!open)}>Toggle</button>
      {open && children}
    </section>
  );
}`,
  `type DisclosureProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

function Disclosure({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: DisclosureProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : uncontrolledOpen;

  function requestOpen(nextOpen: boolean) {
    if (!controlled) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  return (
    <section>
      <button onClick={() => requestOpen(!open)}>Toggle</button>
      {open && children}
    </section>
  );
}`
)}

\`defaultOpen\` is read only for initial uncontrolled state. \`onOpenChange\` reports requests in both modes. Document that an instance must not switch modes during its lifetime; use separate controlled and uncontrolled components if one combined API becomes ambiguous. In a TypeScript library, a union can prohibit contradictory controlled props rather than relying only on documentation.

## Compound components for a shared semantic boundary

Compound components give callers structural freedom while parts coordinate through a private context:

${reactCode(
  language,
  `function Tabs({ value, onValueChange, children }) {
  const context = useMemo(
    () => ({ value, onValueChange }),
    [value, onValueChange]
  );

  return <TabsContext value={context}>{children}</TabsContext>;
}

Tabs.List = function TabsList({ children }) {
  return <div role="tablist">{children}</div>;
};

Tabs.Tab = function Tab({ value, children }) {
  const tabs = useTabsContext();
  return (
    <button
      role="tab"
      aria-selected={tabs.value === value}
      onClick={() => tabs.onValueChange(value)}
    >
      {children}
    </button>
  );
};

Tabs.Panel = function Panel({ value, children }) {
  const tabs = useTabsContext();
  return tabs.value === value ? children : null;
};`,
  `type TabsValue = {
  value: string;
  onValueChange: (value: string) => void;
};

function TabsRoot({
  value,
  onValueChange,
  children,
}: TabsValue & { children: React.ReactNode }) {
  const context = useMemo<TabsValue>(
    () => ({ value, onValueChange }),
    [value, onValueChange]
  );

  return <TabsContext value={context}>{children}</TabsContext>;
}

function TabsList({ children }: { children: React.ReactNode }) {
  return <div role="tablist">{children}</div>;
}

function Tab({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  const tabs = useTabsContext();
  return (
    <button
      role="tab"
      aria-selected={tabs.value === value}
      onClick={() => tabs.onValueChange(value)}
    >
      {children}
    </button>
  );
}

function Panel({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  const tabs = useTabsContext();
  return tabs.value === value ? children : null;
}

const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Tab,
  Panel,
});`
)}

The context is an implementation detail scoped to one compound instance, not application state. A strict consumer Hook catches parts rendered outside their root. Compound APIs are effective for tabs, menus, disclosure groups, and field composition, but use plain props when the relationship is simple—an elaborate namespace is not inherently more reusable.

## Headless behavior separates policy from presentation

A headless Hook can own selection, keyboard policy, or state transitions while callers render their own design-system components. Return semantic state and focused prop-getters or callbacks, not a sprawling set of internals. Render props are another option when the behavior must wrap a render region:

${reactCode(
  language,
  `function Toggle({ children, defaultPressed = false }) {
  const [pressed, setPressed] = useState(defaultPressed);
  return children({
    pressed,
    toggle: () => setPressed((value) => !value),
  });
}

function ToolbarToggle() {
  return (
    <Toggle>
      {({ pressed, toggle }) => (
        <ToolbarButton pressed={pressed} onPress={toggle} />
      )}
    </Toggle>
  );
}`,
  `type ToggleState = {
  pressed: boolean;
  toggle(): void;
};

function Toggle({
  children,
  defaultPressed = false,
}: {
  children: (state: ToggleState) => React.ReactNode;
  defaultPressed?: boolean;
}) {
  const [pressed, setPressed] = useState(defaultPressed);
  return children({
    pressed,
    toggle: () => setPressed((value) => !value),
  });
}

function ToolbarToggle() {
  return (
    <Toggle>
      {({ pressed, toggle }) => (
        <ToolbarButton pressed={pressed} onPress={toggle} />
      )}
    </Toggle>
  );
}`
)}

## Replace Boolean matrices with explicit variants

\`<Banner compact floating dismissible critical sticky />\` exposes combinations the implementation may never support. Model mutually exclusive modes as one \`variant\`, and model workflows as a state machine or discriminated union. Keep independent capabilities independent, but do not represent one conceptual axis with several Booleans.

Common resilient patterns:

- \`children\` for one open content region; named slots for a few semantic regions.
- \`value/onValueChange\` for controlled ownership; \`defaultValue\` for initial uncontrolled state.
- compound parts when descendants share one local semantic model.
- headless Hooks or render props when behavior must be reused across presentations.
- explicit variants or state unions instead of interacting mode flags.
- small domain callbacks such as \`onDismiss(reason)\` instead of exposing setters and internal state.`,
    ),
    exercises: [
      {
        id: "react-component-api-controlled-model",
        title: forReact(() => "Model controlled and uncontrolled requests"),
        instructions: forReact(
          () =>
            `Complete the pure state model for a dual-mode disclosure. If \`controlledValue\` is defined, a request reports that value but preserves internal state. Otherwise, it updates internal state. Return both \`renderedValue\` and \`internalValue\`.

Expected output:

\`\`\`
true:true
true:false
false:false
\`\`\``
        ),
        starterCode: reactVariants(
          `function requestDisclosure(internalValue, controlledValue, requestedValue) {
  // TODO: model the next rendered and internal values.
}

const uncontrolled = requestDisclosure(false, undefined, true);
const controlled = requestDisclosure(false, true, false);
const parentAccepted = requestDisclosure(
  controlled.internalValue,
  false,
  false
);

console.log(
  uncontrolled.renderedValue + ":" + uncontrolled.internalValue
); // expected: true:true
console.log(controlled.renderedValue + ":" + controlled.internalValue);
// expected: true:false
console.log(parentAccepted.renderedValue + ":" + parentAccepted.internalValue);
// expected: false:false`,
          `type DisclosureResult = {
  renderedValue: boolean;
  internalValue: boolean;
};

function requestDisclosure(
  internalValue: boolean,
  controlledValue: boolean | undefined,
  requestedValue: boolean
): DisclosureResult {
  // TODO: model the next rendered and internal values.
  return { renderedValue: false, internalValue };
}

const uncontrolled = requestDisclosure(false, undefined, true);
const controlled = requestDisclosure(false, true, false);
const parentAccepted = requestDisclosure(
  controlled.internalValue,
  false,
  false
);

console.log(
  uncontrolled.renderedValue + ":" + uncontrolled.internalValue
); // expected: true:true
console.log(controlled.renderedValue + ":" + controlled.internalValue);
// expected: true:false
console.log(parentAccepted.renderedValue + ":" + parentAccepted.internalValue);
// expected: false:false`
        ),
      },
      {
        id: "react-component-api-explicit-variants",
        title: forReact(() => "Replace a Boolean mode matrix"),
        instructions: forReact(
          () =>
            `Implement \`bannerReducer\` with explicit \`inline\`, \`floating\`, and \`hidden\` states. \`dismissed\` always produces \`hidden\`; \`shown\` accepts only \`inline\` or \`floating\`. Do not represent the mode with independent \`floating\` and \`hidden\` Booleans.

Expected output:

\`\`\`
floating
hidden
inline
\`\`\``
        ),
        starterCode: reactVariants(
          `function bannerReducer(state, action) {
  // TODO: transition among explicit variants.
  return state;
}

let state = { variant: "inline" };
state = bannerReducer(state, { type: "shown", variant: "floating" });
console.log(state.variant); // expected: floating
state = bannerReducer(state, { type: "dismissed" });
console.log(state.variant); // expected: hidden
state = bannerReducer(state, { type: "shown", variant: "inline" });
console.log(state.variant); // expected: inline`,
          `type VisibleVariant = "inline" | "floating";
type BannerState = { variant: VisibleVariant | "hidden" };
type BannerAction =
  | { type: "shown"; variant: VisibleVariant }
  | { type: "dismissed" };

function bannerReducer(
  state: BannerState,
  action: BannerAction
): BannerState {
  // TODO: transition among explicit variants.
  return state;
}

let state: BannerState = { variant: "inline" };
state = bannerReducer(state, { type: "shown", variant: "floating" });
console.log(state.variant); // expected: floating
state = bannerReducer(state, { type: "dismissed" });
console.log(state.variant); // expected: hidden
state = bannerReducer(state, { type: "shown", variant: "inline" });
console.log(state.variant); // expected: inline`
        ),
      },
    ],
    quiz: [
      {
        id: "react-component-api-patterns-q1",
        prompt: forReact(
          () =>
            "A card must support caller-defined header, body, and action regions. Which API most directly preserves composability?"
        ),
        options: forReact(() => [
          "A configuration object containing every supported visual combination",
          "Children for the body plus named React-node slots for header and actions",
          "Boolean props selecting each known header and action implementation",
          "A context containing mutable elements that descendants replace after render",
        ]),
        answer: 1,
        explanation: forReact(
          () =>
            "Children and named slots let the card own layout while callers compose concrete elements into semantic regions."
        ),
      },
      {
        id: "react-component-api-patterns-q2",
        prompt: forReact(
          () =>
            "What should `defaultOpen` mean in a component supporting both controlled and uncontrolled ownership?"
        ),
        options: forReact(() => [
          "A fallback used whenever the controlled `open` prop is false",
          "A value copied into local state every time it changes",
          "The initial value for an uncontrolled instance only",
          "A request that the parent must accept on the first render",
        ]),
        answer: 2,
        explanation: forReact(
          () =>
            "A default seeds internal ownership. Controlled ownership comes from the current value prop, not from repeatedly synchronizing a default."
        ),
      },
      {
        id: "react-component-api-patterns-q3",
        prompt: forReact(
          () =>
            "When is a compound component API a strong fit?"
        ),
        options: forReact(() => [
          "Whenever a component has more than two props",
          "When all application state should be available through one namespace",
          "When callers must never control child arrangement",
          "When related parts need flexible arrangement around one scoped semantic model",
        ]),
        answer: 3,
        explanation: forReact(
          () =>
            "Compound parts work well when they coordinate through one local model while callers retain structural composition."
        ),
      },
    ],
  },
];
