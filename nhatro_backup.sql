--
-- PostgreSQL database dump
--

\restrict 9MFlRUYWjBBIgtR0VsQ88aRbiBqvlVozSK5dVqxSTZv6f4gIsnUDlaEsJ5OV8VV

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: nhatro
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'SENT',
    'PAID',
    'OVERDUE'
);


ALTER TYPE public."InvoiceStatus" OWNER TO nhatro;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Contract; Type: TABLE; Schema: public; Owner: nhatro
--

CREATE TABLE public."Contract" (
    id text NOT NULL,
    "roomId" text NOT NULL,
    "tenantId" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    deposit integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "filePath" text,
    "endDate" timestamp(3) without time zone,
    "firstBillingDate" integer,
    "lastBillingDate" integer
);


ALTER TABLE public."Contract" OWNER TO nhatro;

--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: nhatro
--

CREATE TABLE public."Invoice" (
    id text NOT NULL,
    "roomId" text NOT NULL,
    "contractId" text NOT NULL,
    period text NOT NULL,
    "rentAmount" integer NOT NULL,
    "electricityAmount" integer NOT NULL,
    "waterAmount" integer NOT NULL,
    "otherFees" integer DEFAULT 0 NOT NULL,
    "totalAmount" integer NOT NULL,
    "referenceCode" text NOT NULL,
    "dueDate" timestamp(3) without time zone NOT NULL,
    status public."InvoiceStatus" DEFAULT 'SENT'::public."InvoiceStatus" NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "markedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "prevElec" double precision DEFAULT 0 NOT NULL,
    "currElec" double precision DEFAULT 0 NOT NULL,
    "prevWater" double precision DEFAULT 0 NOT NULL,
    "currWater" double precision DEFAULT 0 NOT NULL,
    "elecUnitPrice" integer DEFAULT 0 NOT NULL,
    "waterUnitPrice" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Invoice" OWNER TO nhatro;

--
-- Name: Landlord; Type: TABLE; Schema: public; Owner: nhatro
--

CREATE TABLE public."Landlord" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "fullName" text NOT NULL,
    phone text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Landlord" OWNER TO nhatro;

--
-- Name: NotificationLog; Type: TABLE; Schema: public; Owner: nhatro
--

CREATE TABLE public."NotificationLog" (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    "templateKey" text NOT NULL,
    channel text NOT NULL,
    success boolean NOT NULL,
    reason text,
    "sentAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."NotificationLog" OWNER TO nhatro;

--
-- Name: Room; Type: TABLE; Schema: public; Owner: nhatro
--

CREATE TABLE public."Room" (
    id text NOT NULL,
    "roomNumber" text NOT NULL,
    floor integer NOT NULL,
    price integer NOT NULL,
    status text DEFAULT 'AVAILABLE'::text NOT NULL,
    description text,
    "branchId" text,
    "landlordId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "billingDay" integer DEFAULT 15 NOT NULL
);


ALTER TABLE public."Room" OWNER TO nhatro;

--
-- Name: Tenant; Type: TABLE; Schema: public; Owner: nhatro
--

CREATE TABLE public."Tenant" (
    id text NOT NULL,
    "fullName" text NOT NULL,
    phone text,
    "dateOfBirth" timestamp(3) without time zone,
    hometown text,
    "nationalId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantIdDate" text,
    "nationalIdIssuePlace" text,
    email text
);


ALTER TABLE public."Tenant" OWNER TO nhatro;

--
-- Name: User; Type: TABLE; Schema: public; Owner: nhatro
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    username text,
    "passwordHash" text NOT NULL,
    "fullName" text NOT NULL,
    phone text,
    role text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "roomId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO nhatro;

--
-- Name: UtilityRecord; Type: TABLE; Schema: public; Owner: nhatro
--

CREATE TABLE public."UtilityRecord" (
    id text NOT NULL,
    "roomId" text NOT NULL,
    "prevElec" double precision DEFAULT 0 NOT NULL,
    "currElec" double precision DEFAULT 0 NOT NULL,
    "prevWater" double precision DEFAULT 0 NOT NULL,
    "currWater" double precision DEFAULT 0 NOT NULL,
    "recordedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "billingMonth" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UtilityRecord" OWNER TO nhatro;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: nhatro
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO nhatro;

--
-- Data for Name: Contract; Type: TABLE DATA; Schema: public; Owner: nhatro
--

COPY public."Contract" (id, "roomId", "tenantId", "startDate", deposit, status, notes, "createdAt", "updatedAt", "filePath", "endDate", "firstBillingDate", "lastBillingDate") FROM stdin;
cmsilxm99000ljz8qey4kzodt	62e32efb-170c-4321-95aa-bf2284d44d4a	7a5334ce-d961-42ce-bfef-ec8da472dc0a	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.117	2026-08-07 07:12:27.117	\N	\N	\N	\N
cmsilxm9d000njz8qwb6jym69	4b0bbd51-d911-44ef-9565-8a863b8b691b	2be18bd8-db13-4d57-882e-43dbe72dabbe	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.121	2026-08-07 07:12:27.121	\N	\N	\N	\N
cmsilxm9i000pjz8q8jp58ncu	c2904ea9-34eb-4735-8c55-7acdfbad1e20	64a74f3b-c3a9-400c-a89b-02d28d040b44	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.126	2026-08-07 07:12:27.126	\N	\N	\N	\N
cmsilxm9s000tjz8q9vbsq1vs	1f33f26a-1521-4528-af23-180e5046a0a6	9c1472b1-775f-48cb-943c-2edb56ebb74f	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.137	2026-08-07 07:12:27.137	\N	\N	\N	\N
cmsilxm9w000vjz8qvu8uy7sx	21090a8d-37aa-43a4-bcb6-f77cde0c580b	b1ed9d06-cae0-475e-8a90-2b3c1077b83c	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.14	2026-08-07 07:12:27.14	\N	\N	\N	\N
cmsilxma0000xjz8qvebyvfpx	c7f5fe2c-195b-4d39-9863-d2856b9b8b96	689ba31f-552b-4191-9b09-5ca5045b9275	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.144	2026-08-07 07:12:27.144	\N	\N	\N	\N
cmsilxma4000zjz8qbd2wgda7	dc80d85c-e843-47fa-8fae-ce801110d623	e8449864-92dc-49bc-87be-aee920c75bc2	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.148	2026-08-07 07:12:27.148	\N	\N	\N	\N
cmsilxma90011jz8qi2ui6vve	a5f1ec32-83ed-48a7-94e4-6f1c5c177849	cb76ba88-1bbf-463e-ad28-a1bed888838a	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.154	2026-08-07 07:12:27.154	\N	\N	\N	\N
cmsilxmae0013jz8q2xax34q6	cdb12081-11ee-4fe3-a109-244671bc570a	4b71dfb4-12b3-4a65-bc14-f5b03d6bf682	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.158	2026-08-07 07:12:27.158	\N	\N	\N	\N
cmq653x4y0001th01ihljeped	64085007-d2a6-4c2d-bde1-0606e648bbd9	e4d2caa5-88bb-407e-aee2-93b025264689	2026-06-01 00:00:00	0	ACTIVE	khi rời đi phải trả 300.000 đ phí vệ sinh phòng, nếu ở không đủ 1 năm, bên B phải đền bù cho bên A 1 tháng tiền nhà	2026-06-09 04:28:48.898	2026-06-09 04:28:50.498	storage/contracts/cmq653x4y0001th01ihljeped.pdf	2027-06-01 00:00:00	10	15
cmsilxm7v0001jz8q0p2a3grg	238f3e4c-be34-4a6b-a2f5-a44d2da9f387	8da45563-2795-45c1-ac19-7cc423da4d34	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.067	2026-08-07 07:12:27.067	\N	\N	\N	\N
cmsilxm800003jz8qo1qegb1f	a023b61c-cd31-4967-bd32-b5bac64f2da9	f40e63e2-cbdb-44a3-ab46-bc1e482199cf	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.073	2026-08-07 07:12:27.073	\N	\N	\N	\N
cmsilxm8b0007jz8qsh8axgud	984586c4-a484-418d-909d-4577ae9e3850	a8832f10-a388-4300-b9b7-70c95cdd75d6	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.084	2026-08-07 07:12:27.084	\N	\N	\N	\N
cmsilxm8h0009jz8q3ymbwqne	4b05997a-6354-4b02-ac7e-394746ca7eea	68d68507-eb80-4e19-b04e-278f22bd6d74	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.089	2026-08-07 07:12:27.089	\N	\N	\N	\N
cmsilxm8m000bjz8q3dpotet4	081afa25-80db-4fff-b610-f328300836f1	dcffb3a8-5fc2-4825-b9a6-5d884bf93b78	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.094	2026-08-07 07:12:27.094	\N	\N	\N	\N
cmsilxm8q000djz8q7kz17c4f	eff4deea-152d-4f12-b7a2-91089a90e5a3	2deaba0a-ffad-4495-9fe3-fcdb14e4185f	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.099	2026-08-07 07:12:27.099	\N	\N	\N	\N
cmsilxm8v000fjz8q9fp01xgn	998c02e2-edaa-452f-b785-19a94635b2d5	49c3173c-40ed-4831-8d96-2e495e97ebfd	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.104	2026-08-07 07:12:27.104	\N	\N	\N	\N
cmsilxm91000hjz8qz0382ukf	9964155c-c794-436a-ba76-e07993c36f09	493a7bd5-d50a-4000-8dca-454bcca7cd50	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.109	2026-08-07 07:12:27.109	\N	\N	\N	\N
cmsilxm95000jjz8qp5ui3xtg	b502bccb-d148-40bb-800e-6013245b2d07	0f933aba-2981-4aa6-a4f3-34ff3b81cf79	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.113	2026-08-07 07:12:27.113	\N	\N	\N	\N
cmsilxmai0015jz8q97d1pf94	aa78a63e-5378-4484-baa7-8ae0bc7a82f3	0624dc2d-b945-46ce-803d-8d4bba6d7c1a	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.162	2026-08-07 07:12:27.162	\N	\N	\N	\N
cmsilxmam0017jz8q87llbe1t	4597f1be-fd81-4ef9-bbbd-1758945e37d4	ca71434b-3239-4ff7-a4ad-ee3043edf14e	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.166	2026-08-07 07:12:27.166	\N	\N	\N	\N
cmsilxmaq0019jz8qbng3ywv0	076d560c-6ec9-4794-b429-096333389845	7639c8c9-0f62-4e92-a6d2-dbba3157aecf	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.17	2026-08-07 07:12:27.17	\N	\N	\N	\N
cmsilxmay001djz8qse2bgtk2	0f86e07b-0e05-46a0-89aa-af486a91a672	013c9d8f-3461-4d9a-94c3-a7b2cac62f07	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.178	2026-08-07 07:12:27.178	\N	\N	\N	\N
cmsilxmb2001fjz8q5ztyef7k	fd23d52d-2fa4-4730-a901-8678239ce635	d1b06f75-db41-4b82-871a-da3ca81a34f8	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.183	2026-08-07 07:12:27.183	\N	\N	\N	\N
cmsilxmb6001hjz8q47osx98g	71677264-ec62-4699-8f0c-905d01002b72	53fbc2dc-30d7-457d-8da0-69e6dfcb3c73	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.187	2026-08-07 07:12:27.187	\N	\N	\N	\N
cmsilxmbb001jjz8qg1qpuf0y	68cfb7e1-5692-4485-a1f3-90171364d6df	c9c4b028-f583-433c-802d-d5a2e067e0d9	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.191	2026-08-07 07:12:27.191	\N	\N	\N	\N
cmsilxmbf001ljz8qa3e6d7af	16b27e34-f342-4c2d-a32a-b0c140f77f38	9474364b-7aab-44a7-9d1f-7bb3654f6c64	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.195	2026-08-07 07:12:27.195	\N	\N	\N	\N
cmsilxmbk001njz8qzkwg9zhr	81c9186f-deca-41e7-aee1-f832461396e1	f1550326-b2f2-4909-a721-5a5fa36d1a05	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.2	2026-08-07 07:12:27.2	\N	\N	\N	\N
cmsilxmbq001pjz8qmd84frg9	0af7d23c-0f5e-457f-a6f2-e1a3760007f0	7458861a-8d1e-40a1-a5ff-5f5c480b230f	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.206	2026-08-12 10:31:12.087	storage/contracts/cmsilxmbq001pjz8qmd84frg9.pdf	\N	\N	\N
cmsilxmc1001tjz8qpezps9re	4c745eb4-0047-4b42-a0cf-05d62938fe66	c813aa68-7449-488f-a96d-dce365aa0adf	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.217	2026-08-07 07:12:27.217	\N	\N	\N	\N
cmsilxmau001bjz8q6dm6yfbo	27d61e0c-6246-438a-8b0c-26b1c761a433	651e4e10-250c-47e7-8c69-d1164604d7e6	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.174	2026-08-19 01:57:05.297	storage/contracts/cmsilxmau001bjz8q6dm6yfbo.pdf	\N	\N	\N
cmsilxmc7001vjz8qhb4lu1gy	fcb12533-0e56-443c-890a-a313152d9c06	b684d176-3ca7-489f-bf5a-60b3c04b23d1	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.223	2026-08-07 07:12:27.223	\N	\N	\N	\N
cmsilxmcs0023jz8qxsd5w0b5	24642693-14f5-4d7c-ba8e-09bee7d029d2	340a1773-61ec-43c7-9eb5-30af033ae972	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.244	2026-08-07 07:12:27.244	\N	\N	\N	\N
cmsilxmcx0025jz8q6r6m9lxl	f445272e-c351-4d2d-9c63-0945902baefa	5495d289-ee4a-463a-9b9b-dbad43827a1b	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.25	2026-08-07 07:12:27.25	\N	\N	\N	\N
cmsilxmd80029jz8qhhschyrb	ce2562e6-f704-4085-ac27-7839ad12fe39	12df75b3-96e7-4c08-ba4b-635509275ddf	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.261	2026-08-07 07:12:27.261	\N	\N	\N	\N
cmsmzvcyt0001qh01qzcb0zu1	028abfed-1b1c-4b12-9518-c273267a2469	a87d07ae-0c1a-4fb8-a546-18efc5139f87	2026-08-10 00:00:00	0	ACTIVE	\N	2026-08-10 08:53:41.093	2026-08-10 08:53:42.719	storage/contracts/cmsmzvcyt0001qh01qzcb0zu1.pdf	\N	\N	\N
cmspvfzu20009qh01q6qo454h	427beb24-4410-4562-8611-54410343da4b	ad6a534c-c016-4b9a-b499-48916a7402a7	2026-08-12 00:00:00	0	ACTIVE	\N	2026-08-12 09:13:04.299	2026-08-12 09:13:05.489	storage/contracts/cmspvfzu20009qh01q6qo454h.pdf	\N	\N	\N
cmsilxmcn0021jz8qlau15c8q	739b89c7-6304-46e2-b86b-a9b8f963410b	974ac10e-84fd-4c86-ac4b-976f2050d87a	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.24	2026-08-12 09:51:11.3	storage/contracts/cmsilxmcn0021jz8qlau15c8q.pdf	\N	\N	\N
cmsilxmd30027jz8qlgktw128	359bcd6e-6110-4785-a34e-5543742265cd	199a4f8a-339f-4bdb-9e94-71bc5c36da96	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.256	2026-08-07 08:21:14.271	storage/contracts/cmsilxmd30027jz8qlgktw128.pdf	\N	\N	\N
cmsilxmci001zjz8qj1v6fk47	9b34ef0e-44be-42e0-bf45-6139e305897f	f60efe30-9528-4c78-ae5d-7ea6f1e666a1	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.234	2026-08-07 09:24:21.955	storage/contracts/cmsilxmci001zjz8qj1v6fk47.pdf	\N	\N	\N
cmsilxm9n000rjz8q4dv7cdkh	1167cb59-9766-48b4-af8b-77793b918449	98d8dff7-5730-4e7e-a6be-45321506c80f	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.131	2026-08-12 06:13:51.067	storage/contracts/cmsilxm9n000rjz8q4dv7cdkh.pdf	\N	\N	\N
cmsilxmcd001xjz8qfq7i3v7k	0f0ecb53-3b7d-4700-bcbb-3780ca41161e	5e5345e1-4dd1-4a8d-a718-2cd2398b67cb	2026-06-04 00:00:00	0	ACTIVE	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.229	2026-08-14 01:53:00.04	storage/contracts/cmsilxmcd001xjz8qfq7i3v7k.pdf	\N	\N	\N
cmsslt7tp0002p90126vfd7ze	cmsslspk00000p901hsne9923	cmsmqfg2h0001qh01tri1ungn	2026-08-14 00:00:00	0	ACTIVE	\N	2026-08-14 07:06:43.549	2026-08-14 07:06:48.239	storage/contracts/cmsslt7tp0002p90126vfd7ze.pdf	\N	\N	\N
cmsilxm860005jz8qfk5uirnx	167a9499-00d4-455e-85d6-e1863aad969b	e972ee59-1b5d-4fbf-818e-5a256f97045b	2026-06-04 00:00:00	0	TERMINATED	Khởi tạo tự động từ dữ liệu cũ — cần bổ sung	2026-08-07 07:12:27.078	2026-08-14 17:12:12.586	\N	\N	\N	\N
cmst7h93a0002p501lnfirs1m	167a9499-00d4-455e-85d6-e1863aad969b	cmst7h3s90000p501riu8x7l0	2026-08-14 00:00:00	0	ACTIVE	\N	2026-08-14 17:13:16.87	2026-08-14 17:13:22.422	storage/contracts/cmst7h93a0002p501lnfirs1m.pdf	\N	\N	\N
\.


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: nhatro
--

COPY public."Invoice" (id, "roomId", "contractId", period, "rentAmount", "electricityAmount", "waterAmount", "otherFees", "totalAmount", "referenceCode", "dueDate", status, "paidAt", "markedBy", "createdAt", "updatedAt", "prevElec", "currElec", "prevWater", "currWater", "elecUnitPrice", "waterUnitPrice") FROM stdin;
cmsspjufm002fp9017ama4vhs	27d61e0c-6246-438a-8b0c-26b1c761a433	cmsilxmau001bjz8q6dm6yfbo	2026-08	1850000	392000	90000	50000	2382000	NT-P35-082026	2026-08-19 08:51:24.746	PAID	2026-08-14 09:45:33.956	Nguyễn Tài Tiến Đạttt	2026-08-14 08:51:24.754	2026-08-14 09:45:33.958	3052	3164	406	409	3500	30000
cmssp8jqf001vp9010fg9yq72	a5f1ec32-83ed-48a7-94e4-6f1c5c177849	cmsilxma90011jz8qi2ui6vve	2026-08	2200000	332500	90000	50000	2672500	NT-P30-082026	2026-08-19 08:42:37.664	PAID	2026-08-16 04:45:05.935	Nguyễn Tài Tiến Đạttt	2026-08-14 08:42:37.671	2026-08-16 04:45:05.936	5970	6065	620	623	3500	30000
cmsvp00ja000vp501gsgnxwd7	b502bccb-d148-40bb-800e-6013245b2d07	cmsilxm95000jjz8qp5ui3xtg	2026-08	2300000	577500	300000	50000	3227500	NT-P20-082026	2026-08-21 10:59:18.059	PAID	2026-08-16 12:49:59.623	Nguyễn Tài Tiến Đạttt	2026-08-16 10:59:18.07	2026-08-16 12:49:59.624	3787	3952	340	350	3500	30000
cmssp1tx0001jp901h0e2gyws	238f3e4c-be34-4a6b-a2f5-a44d2da9f387	cmsilxm7v0001jz8q0p2a3grg	2026-08	1750000	1298500	210000	50000	3308500	NT-P2-082026	2026-08-19 08:37:24.267	OVERDUE	\N	\N	2026-08-14 08:37:24.276	2026-08-20 01:00:00.083	3158	3529	93	100	3500	30000
cmssp2mz4001np9012gdorquu	028abfed-1b1c-4b12-9518-c273267a2469	cmsmzvcyt0001qh01qzcb0zu1	2026-08	2700000	112000	90000	50000	2952000	NT-P16-082026	2026-08-19 08:38:01.928	OVERDUE	\N	\N	2026-08-14 08:38:01.936	2026-08-20 01:00:00.083	3730	3762	94	97	3500	30000
cmssp9hb4001zp901vg62u6e7	427beb24-4410-4562-8611-54410343da4b	cmspvfzu20009qh01q6qo454h	2026-08	3300000	675500	690000	50000	4715500	NT-P114-082026	2026-08-19 08:43:21.174	OVERDUE	\N	\N	2026-08-14 08:43:21.185	2026-08-20 01:00:00.083	2246	2439	274	297	3500	30000
cmsspcq2i0023p9018yk4kna6	9b34ef0e-44be-42e0-bf45-6139e305897f	cmsilxmci001zjz8qj1v6fk47	2026-08	2800000	1183000	120000	50000	4153000	NT-P206-082026	2026-08-19 08:45:52.498	OVERDUE	\N	\N	2026-08-14 08:45:52.506	2026-08-20 01:00:00.083	809	1147	18	22	3500	30000
cmsspgnj10027p9013za641t0	24642693-14f5-4d7c-ba8e-09bee7d029d2	cmsilxmcs0023jz8qxsd5w0b5	2026-08	3100000	752500	120000	50000	4022500	NT-P210-082026	2026-08-19 08:48:55.826	OVERDUE	\N	\N	2026-08-14 08:48:55.837	2026-08-20 01:00:00.083	888	1103	7	11	3500	30000
cmsspsgi5002np901zk6pew9v	0f86e07b-0e05-46a0-89aa-af486a91a672	cmsilxmay001djz8qse2bgtk2	2026-08	2200000	210000	60000	50000	2520000	NT-P36-082026	2026-08-19 08:58:06.592	OVERDUE	\N	\N	2026-08-14 08:58:06.605	2026-08-20 01:00:00.083	3455	3515	742	744	3500	30000
cmst7hxtn0006p501bo5xsljj	167a9499-00d4-455e-85d6-e1863aad969b	cmst7h93a0002p501lnfirs1m	2026-08	1650000	707000	210000	50000	2617000	NT-P6-082026	2026-08-19 17:13:48.911	OVERDUE	\N	\N	2026-08-14 17:13:48.923	2026-08-20 01:00:00.083	1520	1722	463	470	3500	30000
cmssow2l1001fp901rovq9j7a	0f0ecb53-3b7d-4700-bcbb-3780ca41161e	cmsilxmcd001xjz8qfq7i3v7k	2026-08	3200000	994000	240000	50000	4484000	NT-P204-082026	2026-08-19 08:32:55.563	PAID	2026-08-22 09:07:32.769	Nguyễn Tài Tiến Đạttt	2026-08-14 08:32:55.573	2026-08-22 09:07:32.771	850	1134	41	49	3500	30000
cmssp33bf001rp90135n590al	62e32efb-170c-4321-95aa-bf2284d44d4a	cmsilxm99000ljz8qey4kzodt	2026-08	2050000	920500	150000	50000	3170500	NT-P21-082026	2026-08-19 08:38:23.102	PAID	2026-08-22 09:08:30.291	Nguyễn Tài Tiến Đạttt	2026-08-14 08:38:23.115	2026-08-22 09:08:30.292	3890	4153	925	930	3500	30000
cmszq0zu20003p501xmmhqm6m	cmsslspk00000p901hsne9923	cmsslt7tp0002p90126vfd7ze	2026-08	0	0	0	50000	50000	NT-P999testing-082026	2026-08-24 06:39:08.125	OVERDUE	\N	\N	2026-08-19 06:39:08.138	2026-08-25 01:00:00.075	0	0	0	0	3500	30000
\.


--
-- Data for Name: Landlord; Type: TABLE DATA; Schema: public; Owner: nhatro
--

COPY public."Landlord" (id, "userId", "fullName", phone, "createdAt", "updatedAt") FROM stdin;
cmpxhtc1b0001pd01vqcwznz4	cmpxhtc1b0000pd01ajbusf9y	Nguyễn Thị Hồng Vân	0947547158	2026-06-03 03:14:34.415	2026-06-03 03:14:34.415
cmpxixwvm0001pd01mnio65cw	cmpxixwvl0000pd01o5o59y2d	Nguyễn Tài Thịnh	0915264689	2026-06-03 03:46:07.666	2026-06-03 03:46:07.666
cmpxj21dg0003pd01otfhauws	cmpxj21dg0002pd01fcqw99ro	Nguyễn Tài Tiến Đạt	0375102961	2026-06-03 03:49:20.116	2026-06-03 03:49:20.116
\.


--
-- Data for Name: NotificationLog; Type: TABLE DATA; Schema: public; Owner: nhatro
--

COPY public."NotificationLog" (id, "invoiceId", "templateKey", channel, success, reason, "sentAt") FROM stdin;
cmssrhi650001p901qnebg80h	cmsspjufm002fp9017ama4vhs	invoice-paid	email	t	\N	2026-08-14 09:45:34.781
cmsssflqq0003p101rn33whwy	cmssp33bf001rp90135n590al	invoice-created	email	t	\N	2026-08-14 10:12:05.713
cmssx2yza0001p101hphpdafr	cmssp2mz4001np9012gdorquu	invoice-created	email	t	\N	2026-08-14 12:22:14.415
cmstpgrob0003p501d3nv0f5h	cmssp1tx0001jp901h0e2gyws	invoice-created	sms	t	\N	2026-08-15 01:36:47.387
cmsvbmswa0007p501orqos5i2	cmssp8jqf001vp9010fg9yq72	invoice-paid	email	t	\N	2026-08-16 04:45:06.634
cmsvilggo0009p5014iyavubn	cmssow2l1001fp901rovq9j7a	invoice-due-soon	email	t	\N	2026-08-16 08:00:01.176
cmsvilhcj000bp501iz2tbog4	cmssp1tx0001jp901h0e2gyws	invoice-due-soon	sms	t	\N	2026-08-16 08:00:02.324
cmsvili08000dp501fy303i3g	cmssp2mz4001np9012gdorquu	invoice-due-soon	email	t	\N	2026-08-16 08:00:03.176
cmsviliva000fp501fm9xvc8b	cmssp33bf001rp90135n590al	invoice-due-soon	email	t	\N	2026-08-16 08:00:04.294
cmsviljq3000hp501cbslauhj	cmsspcq2i0023p9018yk4kna6	invoice-due-soon	email	t	\N	2026-08-16 08:00:05.402
cmsvilkaa000jp501povz2cik	cmsspgnj10027p9013za641t0	invoice-due-soon	email	t	\N	2026-08-16 08:00:06.13
cmsvilks5000lp501w9hu0pa7	cmst7hxtn0006p501bo5xsljj	invoice-due-soon	email	t	\N	2026-08-16 08:00:06.773
cmsvp0hls000xp501pvn3z6ts	cmsvp00ja000vp501gsgnxwd7	invoice-created	sms	t	\N	2026-08-16 10:59:40.192
cmsvsydmp000zp501ybc873go	cmsvp00ja000vp501gsgnxwd7	invoice-paid	email	t	\N	2026-08-16 12:50:00.192
cmszq1cr10005p501siyjoipn	cmszq0zu20003p501xmmhqm6m	invoice-created	sms	f	fetch failed	2026-08-19 06:39:24.877
cmszq1z770007p501anpfzrmj	cmszq0zu20003p501xmmhqm6m	invoice-created	sms	f	fetch failed	2026-08-19 06:39:53.971
cmszq35wu0009p501nik08jtr	cmszq0zu20003p501xmmhqm6m	invoice-created	email	t	\N	2026-08-19 06:40:49.326
cmszq3evd000bp501ph6vaf6q	cmszq0zu20003p501xmmhqm6m	invoice-created	sms	f	fetch failed	2026-08-19 06:41:00.937
cmszqgju3000dp501jj4xe19s	cmszq0zu20003p501xmmhqm6m	invoice-created	sms	t	\N	2026-08-19 06:51:13.899
cmszwvxj7000fp501gg6f7xvc	cmsspsgi5002np901zk6pew9v	invoice-created	sms	t	\N	2026-08-19 09:51:09.187
cmt0tcqaa000hp5011n04lvdm	cmsspcq2i0023p9018yk4kna6	invoice-overdue	email	t	\N	2026-08-20 01:00:00.659
cmt0tcqau000jp50167rmxvus	cmssow2l1001fp901rovq9j7a	invoice-overdue	email	t	\N	2026-08-20 01:00:00.678
cmt0tcqba000lp501sp67fwrv	cmst7hxtn0006p501bo5xsljj	invoice-overdue	email	t	\N	2026-08-20 01:00:00.693
cmt0tcqbf000np5018dqi717r	cmsspsgi5002np901zk6pew9v	invoice-overdue	email	t	\N	2026-08-20 01:00:00.699
cmt0tcqbo000pp501tek01jux	cmsspgnj10027p9013za641t0	invoice-overdue	email	t	\N	2026-08-20 01:00:00.708
cmt0tcqbz000rp501e2ltb4zh	cmssp2mz4001np9012gdorquu	invoice-overdue	email	t	\N	2026-08-20 01:00:00.719
cmt0tcqd2000tp501b2afffcs	cmssp33bf001rp90135n590al	invoice-overdue	email	t	\N	2026-08-20 01:00:00.758
cmt0tcqq8000vp501aje1jf2n	cmssp1tx0001jp901h0e2gyws	invoice-overdue	sms	t	\N	2026-08-20 01:00:01.232
cmt2nsqcu000xp5012ysiaglz	cmszq0zu20003p501xmmhqm6m	invoice-due-soon	email	t	\N	2026-08-21 08:00:01.902
cmt45nf3v000zp501kt2spght	cmssow2l1001fp901rovq9j7a	invoice-paid	email	t	\N	2026-08-22 09:07:33.307
cmt45onhh0011p501z8zpteta	cmssp33bf001rp90135n590al	invoice-paid	email	t	\N	2026-08-22 09:08:30.822
cmt45qba40013p501tbu0hjgc	cmszq0zu20003p501xmmhqm6m	invoice-created	sms	f	fetch failed	2026-08-22 09:09:48.316
cmt7yjzn70015p501b7sesi58	cmszq0zu20003p501xmmhqm6m	invoice-overdue	email	t	\N	2026-08-25 01:00:00.69
\.


--
-- Data for Name: Room; Type: TABLE DATA; Schema: public; Owner: nhatro
--

COPY public."Room" (id, "roomNumber", floor, price, status, description, "branchId", "landlordId", "createdAt", "updatedAt", "billingDay") FROM stdin;
21090a8d-37aa-43a4-bcb6-f77cde0c580b	P-26	1	3500000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
64085007-d2a6-4c2d-bde1-0606e648bbd9	P-28	1	2800000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
984586c4-a484-418d-909d-4577ae9e3850	P-8	1	2100000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
f445272e-c351-4d2d-9c63-0945902baefa	P-212	2	3200000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
4b05997a-6354-4b02-ac7e-394746ca7eea	P-10	1	1700000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-08-12 09:05:28.035	30
eff4deea-152d-4f12-b7a2-91089a90e5a3	P-17	1	1900000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-08-12 09:05:28.035	30
b502bccb-d148-40bb-800e-6013245b2d07	P-20	1	2300000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-06-04 10:48:37.904	15
62e32efb-170c-4321-95aa-bf2284d44d4a	P-21	1	2050000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-06-04 10:48:37.904	15
a5f1ec32-83ed-48a7-94e4-6f1c5c177849	P-30	1	2200000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-06-04 10:48:37.904	15
0f86e07b-0e05-46a0-89aa-af486a91a672	P-36	1	2200000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-06-04 10:48:37.904	15
359bcd6e-6110-4785-a34e-5543742265cd	P-214	2	2500000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
fd23d52d-2fa4-4730-a901-8678239ce635	P-102	1	3300000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
71677264-ec62-4699-8f0c-905d01002b72	P-104	1	3800000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
167a9499-00d4-455e-85d6-e1863aad969b	P-6	1	1650000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-08-14 17:13:16.877	15
cmsslspk00000p901hsne9923	P-999-testing 	2	0	OCCUPIED	\N	\N	\N	2026-08-14 07:06:19.872	2026-08-19 06:39:00.265	15
4b0bbd51-d911-44ef-9565-8a863b8b691b	P-22	1	3500000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-08-31 03:21:37.623	30
1167cb59-9766-48b4-af8b-77793b918449	P-24	1	3500000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-08-31 03:24:02.374	15
16b27e34-f342-4c2d-a32a-b0c140f77f38	P-108	1	3300000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
0af7d23c-0f5e-457f-a6f2-e1a3760007f0	P-112	1	3000000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
4c745eb4-0047-4b42-a0cf-05d62938fe66	P-116	1	3200000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
cdb12081-11ee-4fe3-a109-244671bc570a	P-31	1	2200000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
aa78a63e-5378-4484-baa7-8ae0bc7a82f3	P-32	1	1650000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
4597f1be-fd81-4ef9-bbbd-1758945e37d4	P-33	1	1850000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
028abfed-1b1c-4b12-9518-c273267a2469	P-16	1	2700000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-08-10 08:53:41.096	15
739b89c7-6304-46e2-b86b-a9b8f963410b	P-208	2	2500000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
a023b61c-cd31-4967-bd32-b5bac64f2da9	P-4	1	1750000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
081afa25-80db-4fff-b610-f328300836f1	P-12	1	1800000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
9964155c-c794-436a-ba76-e07993c36f09	P-19	1	1900000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
ce2562e6-f704-4085-ac27-7839ad12fe39	P-216	2	3100000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-08-07 08:18:21.009	30
238f3e4c-be34-4a6b-a2f5-a44d2da9f387	P-2	1	1750000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-08-12 09:05:43.037	15
427beb24-4410-4562-8611-54410343da4b	P-114	1	3300000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-08-12 09:13:04.304	15
68cfb7e1-5692-4485-a1f3-90171364d6df	P-106	1	3600000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-06-04 10:48:37.904	15
81c9186f-deca-41e7-aee1-f832461396e1	P-110	1	3000000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-06-04 10:48:37.904	15
27d61e0c-6246-438a-8b0c-26b1c761a433	P-35	1	1850000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-06-04 10:48:37.904	15
fcb12533-0e56-443c-890a-a313152d9c06	P-202	2	3300000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-06-04 10:48:37.904	15
0f0ecb53-3b7d-4700-bcbb-3780ca41161e	P-204	2	3200000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-06-04 10:48:37.904	15
9b34ef0e-44be-42e0-bf45-6139e305897f	P-206	2	2800000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-06-04 10:48:37.904	15
24642693-14f5-4d7c-ba8e-09bee7d029d2	P-210	2	3100000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-06-04 10:48:37.904	15
1f33f26a-1521-4528-af23-180e5046a0a6	P-25	1	1850000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
c7f5fe2c-195b-4d39-9863-d2856b9b8b96	P-27	1	1900000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
dc80d85c-e843-47fa-8fae-ce801110d623	P-29	1	1950000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-05-04 10:33:09.618	30
c2904ea9-34eb-4735-8c55-7acdfbad1e20	P-23	1	2200000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-08-31 03:20:47.099	0
998c02e2-edaa-452f-b785-19a94635b2d5	P-18	1	1800000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-08-31 03:21:31.248	30
076d560c-6ec9-4794-b429-096333389845	P-34	1	1700000	OCCUPIED	\N	\N	\N	2026-06-03 05:21:20.955	2026-08-31 03:48:54.932	30
\.


--
-- Data for Name: Tenant; Type: TABLE DATA; Schema: public; Owner: nhatro
--

COPY public."Tenant" (id, "fullName", phone, "dateOfBirth", hometown, "nationalId", "createdAt", "updatedAt", "tenantIdDate", "nationalIdIssuePlace", email) FROM stdin;
f40e63e2-cbdb-44a3-ab46-bc1e482199cf	Nguyễn Thị Minh	\N	\N	\N	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	\N	\N
e972ee59-1b5d-4fbf-818e-5a256f97045b	Hà Tài Cường	\N	\N	\N	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	\N	\N
a8832f10-a388-4300-b9b7-70c95cdd75d6	Nguyễn Duy Thành	\N	\N	\N	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	\N	\N
64a74f3b-c3a9-400c-a89b-02d28d040b44	Đặng Thị Hương	\N	\N	\N	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	\N	\N
9c1472b1-775f-48cb-943c-2edb56ebb74f	Đoàn Văn Chính	\N	\N	\N	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	\N	\N
e8449864-92dc-49bc-87be-aee920c75bc2	Lâm Mạnh Hùng	\N	\N	\N	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	\N	\N
0624dc2d-b945-46ce-803d-8d4bba6d7c1a	Đỗ Văn Quyết	\N	\N	\N	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	\N	\N
ca71434b-3239-4ff7-a4ad-ee3043edf14e	Nguyễn Trường Lê	\N	\N	\N	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	\N	\N
7639c8c9-0f62-4e92-a6d2-dbba3157aecf	Đoàn Văn Chính	\N	\N	\N	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	\N	\N
f1550326-b2f2-4909-a721-5a5fa36d1a05	Đặng Thu Hương	\N	\N	\N	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	\N	\N
ad6a534c-c016-4b9a-b499-48916a7402a7	Vũ Thu Huyền	\N	\N	\N	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	\N	\N
5495d289-ee4a-463a-9b9b-dbad43827a1b	Vũ Hà My	\N	\N	\N	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	\N	\N
a87d07ae-0c1a-4fb8-a546-18efc5139f87	Vương Hà Tâm	0342673148	\N		010304000114	2026-06-04 02:45:12.069	2026-08-12 07:20:36.378	\N	\N	rinri484@gmail.com
5e5345e1-4dd1-4a8d-a718-2cd2398b67cb	Chu Thị Uyên	0334670957	\N	\N		2026-06-04 02:45:12.069	2026-08-12 07:51:34.88	\N	\N	beuyencubo@gmail.com
4b71dfb4-12b3-4a65-bc14-f5b03d6bf682	Phùng Thúy Phượng	0867848203	2003-07-12 00:00:00	Hà Nội	\N	2026-06-04 02:45:12.069	2026-08-12 08:56:57.286	\N	Hà Nội	Phungthuyphuong12072003@gmail.com
2be18bd8-db13-4d57-882e-43dbe72dabbe	Phạm Thị Thu Thủy	0383498629	1996-01-23 00:00:00	Hưng Yên	\N	2026-06-04 02:45:12.069	2026-08-12 08:56:57.35	\N	Hà Nội	phamthuy.pt3@gmail.com
b1ed9d06-cae0-475e-8a90-2b3c1077b83c	Lưu Thị Thương Yến	0818285666	\N	\N		2026-06-04 02:45:12.069	2026-08-12 07:51:45.425	\N	\N	yenltt2810@gmail.com
651e4e10-250c-47e7-8c69-d1164604d7e6	Nguyễn Thị Phương	0378214348	2000-03-05 00:00:00	Nam Định		2026-06-04 02:45:12.069	2026-08-12 08:56:57.309	\N	Bộ Công An	nguyenphuongpcq@gmail.com
c813aa68-7449-488f-a96d-dce365aa0adf	Nguyễn Phương Thảo	0399498730	2007-04-10 00:00:00	Tân Lạc	\N	2026-06-04 02:45:12.069	2026-08-12 08:56:57.37	\N	Tân Lạc	nguyenphuongthao.07.npt@gmail.com
9474364b-7aab-44a7-9d1f-7bb3654f6c64	Hồ Thị Ngọc Lan	0971369069	1998-05-09 00:00:00	Nghệ An	\N	2026-06-04 02:45:12.069	2026-08-12 08:56:57.388	\N	cục cảnh sát quản lý hành chính về trật tự xã hội	laho9598@gmail.com
cmsmpb54t0000qh012m2q4oyb	Test Curl	\N	\N	\N	\N	2026-08-10 03:58:01.661	2026-08-10 03:58:01.661	\N	\N	\N
e4d2caa5-88bb-407e-aee2-93b025264689	Chu Thị Vân	0389381223	2004-07-01 00:00:00	thôn Họa Đống - Ưng Thiên - Hà Nội		2026-06-04 02:45:12.069	2026-08-12 07:51:38.32	14/05/2026	\N	\N
cmsmqfg2h0001qh01tri1ungn	Nguyễn Tài Tiến Đạt	0375102961	2005-03-26 03:55:34.257	Hà Nội		2026-08-10 04:29:22.065	2026-08-12 07:52:01.857	22/12/2022	Cục Cảnh sát QLHC về TTXH	bi26032005@gmail.com
974ac10e-84fd-4c86-ac4b-976f2050d87a	Dương Quang Thắng	0862886521	2005-07-04 06:38:41.738	Phú Thọ	\N	2026-06-04 02:45:12.069	2026-08-14 06:41:09.91	\N	Cục QLHC về TTATXH	duongquangthang4705@gmail.com
68d68507-eb80-4e19-b04e-278f22bd6d74	Trần Thị Vân Anh	\N	1997-08-25 00:00:00	Ninh Bình	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	Cục CS QLHC về TTXH	Vananhtranthi515@gmail.com
dcffb3a8-5fc2-4825-b9a6-5d884bf93b78	Trần Thị Vân Anh	\N	1997-08-25 00:00:00	Ninh Bình	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	Cục CS QLHC về TTXH	Vananhtranthi515@gmail.com
2deaba0a-ffad-4495-9fe3-fcdb14e4185f	Lê Văn Kiền	0973005326	1989-07-02 00:00:00	Nam Ninh, Ninh Bình	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	Nam Định	kienle.020789@gmail.com
493a7bd5-d50a-4000-8dca-454bcca7cd50	Lê Văn Kiền	0973005326	1989-07-02 00:00:00	Nam Ninh, Ninh Bình	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	Nam Định	kienle.020789@gmail.com
0f933aba-2981-4aa6-a4f3-34ff3b81cf79	Trần Thị Hồng Thúy	0971649381	1981-03-17 00:00:00	Đan Hải, Nghi Xuân, Hà Tĩnh	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	Cục trưởng cục công an	tranthihongthuy.hn@gmail.com
cb76ba88-1bbf-463e-ad28-a1bed888838a	Phạm Kim Chi	0366860913	2003-03-31 00:00:00	Nam Định	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	Cục CS QLHC về TTXH	phamkimchi313@gmail.com
d1b06f75-db41-4b82-871a-da3ca81a34f8	Nguyễn Văn Hải	0388886848	1997-09-29 00:00:00	Hoa Lộc, Hậu Lộc, Thanh Hóa	\N	2026-06-04 02:45:12.069	2026-08-10 04:41:34.401	\N	Công an Thanh Hóa	hai.hht.th@gmail.com
53fbc2dc-30d7-457d-8da0-69e6dfcb3c73	Vũ Minh Hiếu	0877756280	\N	\N	\N	2026-06-04 02:45:12.069	2026-08-10 04:41:49.328	\N	\N	hieuvutech@gmail.com
c9c4b028-f583-433c-802d-d5a2e067e0d9	Nguyễn Thu Hồng	0342350990	1991-09-27 00:00:00	Hà Nội	\N	2026-06-04 02:45:12.069	2026-08-10 04:42:49.33	\N	CQL về TTXH	honganh270991@gmail.com
689ba31f-552b-4191-9b09-5ca5045b9275	Nguyễn Thị Hằng	0969237996	1997-03-15 12:18:32.894	xã lam sơn, thanh hoá	\N	2026-06-04 02:45:12.069	2026-08-14 12:19:53.432	\N	Thanh Hoá	annahang150396@gmail.com
b684d176-3ca7-489f-bf5a-60b3c04b23d1	Hà Thị Thu Thủy	0965353872	1999-07-09 00:00:00	Thái Bình	\N	2026-06-04 02:45:12.069	2026-08-14 06:50:25.521	\N	CA tỉnh Thái Bình	hathithuthuy9799@gmail.com
49c3173c-40ed-4831-8d96-2e495e97ebfd	Đinh Xuân Hiếu	0902100005	\N	Phường Tam Chúc, Ninh Bình	\N	2026-06-04 02:45:12.069	2026-08-14 08:25:00.853	\N	Công an hà nam cũ	\N
7458861a-8d1e-40a1-a5ff-5f5c480b230f	Bùi Thị Loan	0346081221	1987-04-25 00:00:00	Khu 17 Đào Xá Phú Thọ		2026-06-04 02:45:12.069	2026-08-19 09:48:57.749	\N	Phú Thọ	mmeomeo638@gmail.com
98d8dff7-5730-4e7e-a6be-45321506c80f	Vũ Trường Quân	0916217166	\N	\N	036090012357	2026-06-04 02:45:12.069	2026-08-19 09:49:33.216	\N	\N	truongquanxd@gmail.com
7a5334ce-d961-42ce-bfef-ec8da472dc0a	Nguyễn Văn Phúc	0902198822	1993-04-12 09:43:26.314	Nghệ An	\N	2026-06-04 02:45:12.069	2026-08-14 09:43:50.838	\N	Bộ Công An	phuclv.1204@gmail.com
8da45563-2795-45c1-ac19-7cc423da4d34	Đinh Thị Thanh Tú	0946884693	1993-03-12 10:23:10.631	Ba Vì	\N	2026-06-04 02:45:12.069	2026-08-14 10:24:09.506	\N	Cục quản lý tt công an tp HN	\N
013c9d8f-3461-4d9a-94c3-a7b2cac62f07	Đỗ Văn Luy	0934551899	1996-07-17 09:50:07.5	\N	\N	2026-06-04 02:45:12.069	2026-08-19 09:50:47.431	\N	\N	hoanganh1771996@gmail.com
f60efe30-9528-4c78-ae5d-7ea6f1e666a1	Nguyễn Anh Tuấn	0326451719	2002-10-10 00:00:00	Phú Thọ	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	Thanh Thủy, Phú Thọ	tn688839@gmail.com
340a1773-61ec-43c7-9eb5-30af033ae972	Vũ Văn Lành	0961960700	1999-01-01 00:00:00	Nghệ An	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	Cục QL TTXH	lanhlem124@gmail.com
199a4f8a-339f-4bdb-9e94-71bc5c36da96	Nguyễn Văn Hoàn	0967788893	1993-08-08 00:00:00	Phường Kỳ Sơn, Phú Thọ	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	Hòa Bình	Khoanglangtrongtim68@gmail.com
12df75b3-96e7-4c08-ba4b-635509275ddf	Lê Quang Bách	0373740261	2000-01-19 00:00:00	Ninh Bình	\N	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069	\N	Cục cảnh sát	bachxtnd2000@gmail.com
cmst7h3s90000p501riu8x7l0	Nguyễn Minh Cơ	0868085823	1999-07-20 17:12:37.469	Xã Triệu Việt Vương- Hưng Yên	\N	2026-08-14 17:13:09.992	2026-08-14 17:13:09.992	\N	Huyện Khoái Châu	Minh61759@gmail.com
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: nhatro
--

COPY public."User" (id, email, username, "passwordHash", "fullName", phone, role, "isActive", "roomId", "createdAt", "updatedAt") FROM stdin;
cmpxhtc1b0000pd01ajbusf9y	hongvan29061973@nhatro.local	hongvan29061973	$2b$10$WUFnI1nm6eEL5XXj3JCawOXbijp9UTq6hrQ0pdErAV0OfOG3oozY6	Nguyễn Thị Hồng Vân	0947547158	LANDLORD	t	\N	2026-06-03 03:14:34.415	2026-06-03 03:14:34.415
cmpxixwvl0000pd01o5o59y2d	taithinh111169@nhatro.local	taithinh111169	$2b$10$fitY.fVWf5fpQkcOiJQLGu6Egvf6b68T0eSXeMnJCJ0W0jMcwoJHK	Nguyễn Tài Thịnh	0915264689	LANDLORD	t	\N	2026-06-03 03:46:07.666	2026-06-03 03:46:07.666
f03c96d4-fadb-46e8-99bb-186353096b2f	phong2@nhatro.local	phong2	$2b$10$ysvsz36XFj0Cux0t2ZuIe.mv5G4f/5esIOWZo1xj4eFl5cS7haYP.	Đinh Thị Thanh Tú	\N	TENANT	t	238f3e4c-be34-4a6b-a2f5-a44d2da9f387	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
9d0be1a7-cd2b-4aba-9a6d-c0bd3082a233	phong4@nhatro.local	phong4	$2b$10$rsBXsUHjLfornIkRc7UzD.MbQMd2ya.KDH6YbPw1q.y1T1eqiXEcO	Nguyễn Thị Minh	\N	TENANT	t	a023b61c-cd31-4967-bd32-b5bac64f2da9	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
22f4a361-f395-4153-be5a-d7b383369565	phong6@nhatro.local	phong6	$2b$10$W3mpyXJojkMJWLq/0R1nxeXA9Lw3nNNmga0/O1iDk/2wI9GQrmdse	Hà Tài Cường	\N	TENANT	t	167a9499-00d4-455e-85d6-e1863aad969b	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
042e46f5-80f9-40a2-95e6-d89cfefc939e	phong8@nhatro.local	phong8	$2b$10$HwIJIxqRRkHDss/q7T9vUO/52lbRxUHj1./vLvSjxJACsjD5UFIKO	Nguyễn Duy Thành	\N	TENANT	t	984586c4-a484-418d-909d-4577ae9e3850	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
e61f2ba2-bbe6-429b-b767-c944eedf21b7	phong10@nhatro.local	phong10	$2b$10$hYWq53PLBa08I7GXefZxweCXCWqA7iuzmo7rPg/VP06p.4AzGYKFS	Nguyễn Thị Vân Anh	\N	TENANT	t	4b05997a-6354-4b02-ac7e-394746ca7eea	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
eeed7c4f-4854-4a13-8974-bc2d7187ac3e	phong12@nhatro.local	phong12	$2b$10$M5anV7b06HX9Pj/2yV9POe8twzFlm9KPF1NcgEln4TYOa/2zEoUf6	Nguyễn Thị Vân Anh	\N	TENANT	t	081afa25-80db-4fff-b610-f328300836f1	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
d3d5ad55-10b3-4c1d-b573-e03fde0e22b5	phong16@nhatro.local	phong16	$2b$10$88JiIHPnVwoY6gEfdh6nluhnzEvgkr8MYCcKcZGwMiWuyTYGDzoKS	Vương Hà Tâm	\N	TENANT	t	028abfed-1b1c-4b12-9518-c273267a2469	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
0aa16622-93f4-475f-a999-18b7cd5d5170	phong17@nhatro.local	phong17	$2b$10$x1jNEkCSyd0wOqwU0v9wG.UCjMnY5TjTcvTdDsrd0m3Ld81j8eOqu	Nguyễn Văn Kền	\N	TENANT	t	eff4deea-152d-4f12-b7a2-91089a90e5a3	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
892e2679-a8a5-48b2-a853-ebe616327cf1	phong18@nhatro.local	phong18	$2b$10$XeAzAC25NDz/BqShe.Ai0eJEAQ8GuV5ZwWlZQr2uIQBx6eNs5mPsy	Đinh Xuân Hiếu	\N	TENANT	t	998c02e2-edaa-452f-b785-19a94635b2d5	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
2ee1d457-ec0c-4382-b07b-b14d75b19052	phong19@nhatro.local	phong19	$2b$10$gRZ5gQJtH7StehGCZ6SHqebi4UZwtwW9ICczyVzrckzPrL.L1x6ri	Nguyễn Văn Kền	\N	TENANT	t	9964155c-c794-436a-ba76-e07993c36f09	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
658702f4-81c7-4e39-bc3a-d53fcc55cd59	phong20@nhatro.local	phong20	$2b$10$yjN6HZCeu6FClVDCLfwZYepfy/sznKe.NcqmX23SqzvaOSV1hy9cS	Trần Thị Thúy	\N	TENANT	t	b502bccb-d148-40bb-800e-6013245b2d07	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
222d72e0-66ed-4453-8ec4-3d08930d1db5	phong21@nhatro.local	phong21	$2b$10$dbWZsaPZlRizSgLFIRgRMunwAjH7HxSk1iQdPNHMofVTgdwG.id2e	Nguyễn Văn Phúc	\N	TENANT	t	62e32efb-170c-4321-95aa-bf2284d44d4a	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
8d43275e-c68e-40b9-86dd-7c0e9a382f36	phong23@nhatro.local	phong23	$2b$10$vhVhXx2rY.zD7nEZe/7DwOKiC0pgYliehnWKMUv21fpy7k/q5sJNi	Đặng Thị Hương	\N	TENANT	t	c2904ea9-34eb-4735-8c55-7acdfbad1e20	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
6b891c14-487e-42a1-bbfc-6857d9b53938	phong25@nhatro.local	phong25	$2b$10$HTSefXK55P/E9VJKLDPa5uUWZ1.XN1mN9gcB8bfdSvvNOtDSAStJe	Đoàn Văn Chính	\N	TENANT	t	1f33f26a-1521-4528-af23-180e5046a0a6	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
8c5051fa-9c00-4208-82c0-5b609465ff16	phong26@nhatro.local	phong26	$2b$10$DxTBNcO/lHN.trhKt8r5buM7kc2tfLqu1wN.VGInlyTdPdZ1HmTwS	Lưu Thị Thương Yến	\N	TENANT	t	21090a8d-37aa-43a4-bcb6-f77cde0c580b	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
011d44a1-34a7-4e60-9560-c184178f91b5	phong27@nhatro.local	phong27	$2b$10$lD83Ss5.1ERNleyO6Dk4D.mixlstCRqompz2U3HwP2UgvQe1b05/i	Nguyễn Thị Hằng	\N	TENANT	t	c7f5fe2c-195b-4d39-9863-d2856b9b8b96	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
bfecb9fe-bcb0-43dd-9560-9831fd6b7a99	phong28@nhatro.local	phong28	$2b$10$OxT4MmAywrDvoZ976df2rO7sfiqufmGAMWBg40jxhEhcUFoyJ3HVW	Chu Thị Vân	\N	TENANT	t	64085007-d2a6-4c2d-bde1-0606e648bbd9	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
19337648-68a2-42a5-8f78-c62454f78064	phong29@nhatro.local	phong29	$2b$10$.t4Y/zwLdC3M8ZzAJc0Ot.gYAZTd8NSCGPyAUZDE1xoxoDRlwEcie	Lâm Mạnh Hùng	\N	TENANT	t	dc80d85c-e843-47fa-8fae-ce801110d623	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
1a56726b-de58-4b27-a5b6-34027a5fdb42	phong30@nhatro.local	phong30	$2b$10$d2mwCI0nqZae2u.qeNtfvOIVWWsBRVO62R4mcH9WtrgMFOM9Rrtj2	Phạm Kim Chi	\N	TENANT	t	a5f1ec32-83ed-48a7-94e4-6f1c5c177849	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
1d80b995-c926-4015-9d6b-21c004ebfc48	phong31@nhatro.local	phong31	$2b$10$i.sxdu0znUtr4VD7Vr.8GeRrNK/gDm60cRGIZEoxBacQOsLkOR2Yi	Phùng Thúy Phượng	\N	TENANT	t	cdb12081-11ee-4fe3-a109-244671bc570a	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
51194910-25c7-49eb-bc31-ebae2ae0c259	phong32@nhatro.local	phong32	$2b$10$Jboa4O9dEkgCssb2kBGfeesLEZF.sDWYw9HdWt8QlW3O7xcizB2By	Đỗ Văn Quyết	\N	TENANT	t	aa78a63e-5378-4484-baa7-8ae0bc7a82f3	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
6f0d9b1d-b656-486e-8eaa-86d1f5c4b064	phong33@nhatro.local	phong33	$2b$10$TQEYyJSch2nnh9ZzgSDtFO20u3u.N3AFV0VuWwJw0kIrHdCQnkCrq	Nguyễn Trường Lê	\N	TENANT	t	4597f1be-fd81-4ef9-bbbd-1758945e37d4	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
369b1909-4531-4c4a-81b7-dd2c081b9063	phong34@nhatro.local	phong34	$2b$10$lDfSBnCvxWZrldPe3V6zB.CaI7PBy9yIdFVlO3ptCcAxcaj0B5NMi	Đoàn Văn Chính	\N	TENANT	t	076d560c-6ec9-4794-b429-096333389845	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
e65d38a6-11ec-4738-8e6b-29a020e38fc2	phong35@nhatro.local	phong35	$2b$10$FRtQToX8XVGGEGEKHT2hWeKxdtykhp8xJy0tWVjPBMIOy1tOPrxGC	Nguyễn Thị Phương	\N	TENANT	t	27d61e0c-6246-438a-8b0c-26b1c761a433	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
cmpxj21dg0002pd01fcqw99ro	tiendat260305@nhatro.local	tiendat260305	$2b$10$bELlTpBXCRijMj872QV8i.6o0sYgIUFEdPkcRjCHAclPZe7AIxRja	Nguyễn Tài Tiến Đạt	0375102961	ADMIN	t	\N	2026-06-03 03:49:20.116	2026-08-07 03:20:07.723
ecc4314b-64e8-4db9-bd63-6b3c40980417	phong22@nhatro.local	phong22	$2b$10$7enzhAewX4HoSsUaVZaGw.sn1H71vfme2fIw18nNIeeCi0gkiq74q	Phạm Thị Thu Thủy	\N	TENANT	t	4b0bbd51-d911-44ef-9565-8a863b8b691b	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
3934decf-1876-421f-823e-c838cfab89b1	phong36@nhatro.local	phong36	$2b$10$TLZr//Eu3ZFmx.xBi9c9xOBE.FVHJx.T7BjL.F5zYGHRzkXFqqKiy	Đỗ Văn Luy	\N	TENANT	t	0f86e07b-0e05-46a0-89aa-af486a91a672	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
a390552a-c6c8-4ea1-9b2f-537da61603c9	phong102@nhatro.local	phong102	$2b$10$cso9yzN4vuN76cWrPAjt6uQ3HgCWi.9OKewibcWUFccUQL5EYf5zG	Nguyễn Văn Hải	\N	TENANT	t	fd23d52d-2fa4-4730-a901-8678239ce635	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
d8585019-03ac-4965-98d4-7f41647414d1	phong104@nhatro.local	phong104	$2b$10$SWi/10xtgR6mVBcBw8lHgut.36mgVZANWtZp2Ljsuvkw4VDYhKKw6	Vũ Minh Hiếu	\N	TENANT	t	71677264-ec62-4699-8f0c-905d01002b72	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
b66cf212-e5bd-4b5c-916f-ab8346c6b399	phong24@nhatro.local	phong24	$2b$10$Yt0LWNNeUW3XOWEuwKHzGe38kO68PiTSe2FF/c6/e896nMy5CCF0S	Vũ Trường Quân	\N	TENANT	t	1167cb59-9766-48b4-af8b-77793b918449	2026-06-04 02:45:12.069	2026-08-19 01:55:50.241
acc2fcf4-c8fb-41a2-aceb-930363507342	phong106@nhatro.local	phong106	$2b$10$./wvoUGe0XeRA4soErtGh.NfwuW8QXORwI0GCLC83JUtuA7mkRcyS	Nguyễn Thu Hồng	\N	TENANT	t	68cfb7e1-5692-4485-a1f3-90171364d6df	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
ca0a64a2-af8e-4e73-9916-da7bf5887c2a	phong108@nhatro.local	phong108	$2b$10$pfAWuQk/iFBBZit9S3zIMuZSedC87OINDOMhZOEGftm2juL5nTByS	Hồ Thị Ngọc Lan	\N	TENANT	t	16b27e34-f342-4c2d-a32a-b0c140f77f38	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
93d13bfa-ca3d-416a-b233-a2bcce7345d4	phong110@nhatro.local	phong110	$2b$10$ihhgzWfQdgugB4yiwZKzCeDlLLZDLrjV74xEREuhcdc3UXLXEUy3C	Đặng Thu Hương	\N	TENANT	t	81c9186f-deca-41e7-aee1-f832461396e1	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
0d1e11c6-8d53-4a08-9c69-7157c5b16b9f	phong112@nhatro.local	phong112	$2b$10$e2f3oMyN/Rdz9xBFRMxmv.zcW7pyOHR90gecGK6M2MqMKry1Rt1aO	Nguyễn Thị Loan	\N	TENANT	t	0af7d23c-0f5e-457f-a6f2-e1a3760007f0	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
676f5ea6-3c64-4631-ab84-ab7b5cd6d0e0	phong114@nhatro.local	phong114	$2b$10$ZWLGfl1w2fgHQTtvWY76Y.FZ52FmdLwMRcHz0JE/fI4N93X32ZUSe	Vũ Thu Huyền	\N	TENANT	t	427beb24-4410-4562-8611-54410343da4b	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
6016a46d-5960-4156-acd2-5e445b5ecb3a	phong116@nhatro.local	phong116	$2b$10$MlgugkCiKqwTEQ3LxlI6f.pujUJkfvbHPIekX3w.IFLu12D17NEk2	Nguyễn Phương Thảo	\N	TENANT	t	4c745eb4-0047-4b42-a0cf-05d62938fe66	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
ecc0c83f-d9f1-432f-9fce-174b7dd52c18	phong202@nhatro.local	phong202	$2b$10$ZFpLsrH4FHzfl5iHeQ0u9.4SwEgvcLiU1xsbAi/n133mTv34PQW9.	Trần Thị Thu Thủy	\N	TENANT	t	fcb12533-0e56-443c-890a-a313152d9c06	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
acfcefa7-219c-469a-98c6-678580f3e344	phong204@nhatro.local	phong204	$2b$10$Frl5zdt2cpvj8VDfoct3F./LfN4LPsdTJdAYD.7JC0DNjkBLXR55O	Chu Thị Uyên	\N	TENANT	t	0f0ecb53-3b7d-4700-bcbb-3780ca41161e	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
a0c947bf-aaab-4b66-9bc3-c44326c436dd	phong206@nhatro.local	phong206	$2b$10$cTpZhWbXX6l.QojWpxR8iuUhUjtpIJTvh/npC2BJiznmJLhRShstq	Nguyễn Anh Tuấn	\N	TENANT	t	9b34ef0e-44be-42e0-bf45-6139e305897f	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
39e18c9d-bf55-4cc3-bf05-377c66921a92	phong208@nhatro.local	phong208	$2b$10$EzUe6utg/52dzNwDnYJTo.0Bs.4KpMeQvsW6gtuRJqnQODKh2VULu	Dương Quang Thắng	\N	TENANT	t	739b89c7-6304-46e2-b86b-a9b8f963410b	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
8e331ed8-1f25-4e3e-86fd-d9211d64e7dd	phong210@nhatro.local	phong210	$2b$10$G2erYUegLK4eR4FH.thUsuMcw9lwVMRmrEbSJ57JrqP1rLFYgKw36	Vũ Văn Lành	\N	TENANT	t	24642693-14f5-4d7c-ba8e-09bee7d029d2	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
7830b0f8-78bf-48e4-91bc-b071d7ba3cb0	phong212@nhatro.local	phong212	$2b$10$iQ0IgGZD90FMUK3l7rexM.eDQ2yobD4/.rvj9qgN5emSi/Af4R7MK	Vũ Hà My	\N	TENANT	t	f445272e-c351-4d2d-9c63-0945902baefa	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
e7089b47-4ca7-4b9c-bcd3-09152341e1e7	phong214@nhatro.local	phong214	$2b$10$0K/G/p1578R09cfMfug7ous7rkuHjsFtPMIZuA84YNvbvNYbvjTGy	Nguyễn Văn Hoàn	\N	TENANT	t	359bcd6e-6110-4785-a34e-5543742265cd	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
6a0c0185-07d3-48fe-bbdf-0c495f727841	phong216@nhatro.local	phong216	$2b$10$tOdATpwiE6I4Oi3VSLJk8uZpI.p6OIeVgq5/F9Te7gqJFEQU.prYC	Lê Quang Bách	\N	TENANT	t	ce2562e6-f704-4085-ac27-7839ad12fe39	2026-06-04 02:45:12.069	2026-06-04 02:45:12.069
cmpxmg8ba0000jzqm4qr66quy	admin@nhatro.vn	tiendat	$2b$10$1pIpYwYML.ts0NfTHDawbOQDQNO2WhSvXT53EGkHYUy/PzIGxpGnC	Nguyễn Tài Tiến Đạttt	0375102961	ADMIN	t	\N	2026-06-03 05:24:21.141	2026-08-13 13:01:24.036
\.


--
-- Data for Name: UtilityRecord; Type: TABLE DATA; Schema: public; Owner: nhatro
--

COPY public."UtilityRecord" (id, "roomId", "prevElec", "currElec", "prevWater", "currWater", "recordedAt", "billingMonth", "createdAt", "updatedAt") FROM stdin;
cmspvm00u000bqh010rwxl0qe	427beb24-4410-4562-8611-54410343da4b	0	2246	0	274	2026-08-12 09:17:44.477	2026-07	2026-08-12 09:17:44.479	2026-08-12 09:17:44.479
cmspvmcq0000fqh014f08ntqn	fcb12533-0e56-443c-890a-a313152d9c06	0	1512	0	55	2026-08-12 09:18:00.935	2026-07	2026-08-12 09:18:00.937	2026-08-12 09:18:00.937
cmspvn8c8000jqh01leacoyrx	c7f5fe2c-195b-4d39-9863-d2856b9b8b96	0	2902	0	352	2026-08-12 09:18:41.911	2026-07	2026-08-12 09:18:41.912	2026-08-12 09:18:41.912
cmspvnpbd000nqh012nkcfizx	4597f1be-fd81-4ef9-bbbd-1758945e37d4	0	2066	0	4	2026-08-12 09:19:03.912	2026-07	2026-08-12 09:19:03.913	2026-08-12 09:19:03.913
cmspvob6w000rqh01kvqk6kzz	71677264-ec62-4699-8f0c-905d01002b72	0	2982	0	303	2026-08-12 09:19:32.263	2026-07	2026-08-12 09:19:32.264	2026-08-12 09:19:32.264
cmspvorxl000vqh014iiga597	ce2562e6-f704-4085-ac27-7839ad12fe39	0	1483	0	25	2026-08-12 09:19:53.96	2026-07	2026-08-12 09:19:53.961	2026-08-12 09:19:53.961
013a6d8a-1546-4963-b4a0-e51c16693115	a023b61c-cd31-4967-bd32-b5bac64f2da9	0	3173	0	872	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
6e642e10-4d1e-4036-af14-cc378344a33c	984586c4-a484-418d-909d-4577ae9e3850	0	5374	0	897	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
8cd2b119-8dc7-4fd1-bdfa-adfdb0d7a969	4b05997a-6354-4b02-ac7e-394746ca7eea	0	398	0	801	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
4edff489-3d94-4c63-b6c1-5700bc37b1ec	081afa25-80db-4fff-b610-f328300836f1	0	4099	0	580	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
ea076d0e-deff-447e-9df7-3a59b3257a06	eff4deea-152d-4f12-b7a2-91089a90e5a3	0	5331	0	1928	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
b65e174f-edb8-42bb-9e4e-2f858c9d2113	998c02e2-edaa-452f-b785-19a94635b2d5	0	5273	0	900	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
1e30f7af-c936-41de-a9f1-03cb70a9fd7f	9964155c-c794-436a-ba76-e07993c36f09	0	5584	0	1309	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
b34b0bc0-9312-4454-a8e9-7860bc2c1d80	c2904ea9-34eb-4735-8c55-7acdfbad1e20	0	7052	0	551	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
881ae285-a8bc-4764-9c1f-8d2b27c542de	1f33f26a-1521-4528-af23-180e5046a0a6	0	6869	0	745	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
bc742e58-c1c6-4874-a705-1260400dda99	64085007-d2a6-4c2d-bde1-0606e648bbd9	0	656	0	575	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
e647ae78-30b7-492c-919b-98caaef1eca4	cdb12081-11ee-4fe3-a109-244671bc570a	0	3190	0	791	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
e6235263-9e73-4033-892a-687af676bec0	aa78a63e-5378-4484-baa7-8ae0bc7a82f3	0	3443	0	931	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
bb68a198-8da2-4a5d-b008-50ee63c6cc2b	076d560c-6ec9-4794-b429-096333389845	0	2024	0	562	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
f0ee314d-f94e-4f68-a3af-8f38c54a4b93	fd23d52d-2fa4-4730-a901-8678239ce635	0	1361	0	39	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
d3c929db-1bab-4d51-acf4-82c787cc7b3a	68cfb7e1-5692-4485-a1f3-90171364d6df	0	2040	0	47	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
9de5eed9-74ff-4677-b764-72078831a174	16b27e34-f342-4c2d-a32a-b0c140f77f38	0	1632	0	51	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
152f5b1a-099b-4a25-9a28-27547244ea5b	0af7d23c-0f5e-457f-a6f2-e1a3760007f0	0	2676	0	560	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
55e8f616-454d-43a9-935f-4a02902699da	4c745eb4-0047-4b42-a0cf-05d62938fe66	0	2549	0	41	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
8e49b2f8-b3fd-41e4-9fc5-e1e38d7f1ea0	739b89c7-6304-46e2-b86b-a9b8f963410b	0	1170	0	14	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
b3486cc0-aedd-4958-b5d9-a1e0ea9e4998	f445272e-c351-4d2d-9c63-0945902baefa	0	924	0	48	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
a334887d-15c5-410f-96f8-6d65e68a6dfe	359bcd6e-6110-4785-a34e-5543742265cd	0	1044	0	95	2026-08-14 07:05:05.128	2026-07	2026-08-14 07:05:05.128	2026-08-14 07:05:05.128
cmssma4rb0001p901lnyeuqou	dc80d85c-e843-47fa-8fae-ce801110d623	0	6728	0	606	2026-08-14 07:19:52.724	2026-07	2026-08-14 07:19:52.727	2026-08-14 07:19:52.727
cmsso1w0n0001p90128tk38yb	028abfed-1b1c-4b12-9518-c273267a2469	0	3730	0	94	2026-08-14 08:09:27.381	2026-07	2026-08-14 08:09:27.383	2026-08-14 08:09:27.383
cmsso3uk20009p9019ev2tby0	238f3e4c-be34-4a6b-a2f5-a44d2da9f387	0	3158	0	93	2026-08-14 08:10:58.801	2026-07	2026-08-14 08:10:58.802	2026-08-14 08:10:58.802
cmsso47fp000dp9013dj882ka	62e32efb-170c-4321-95aa-bf2284d44d4a	0	3890	0	925	2026-08-14 08:11:15.493	2026-07	2026-08-14 08:11:15.494	2026-08-14 08:11:15.494
cmsso4n46000hp901uqtanayn	27d61e0c-6246-438a-8b0c-26b1c761a433	0	3052	0	406	2026-08-14 08:11:35.813	2026-07	2026-08-14 08:11:35.814	2026-08-14 08:11:35.814
cmsso5e5f000pp901km97af4r	a5f1ec32-83ed-48a7-94e4-6f1c5c177849	0	5970	0	620	2026-08-14 08:12:10.85	2026-07	2026-08-14 08:12:10.851	2026-08-14 08:12:10.851
cmsso5xj6000tp901mj9mm2lj	81c9186f-deca-41e7-aee1-f832461396e1	0	3095	0	293	2026-08-14 08:12:35.967	2026-07	2026-08-14 08:12:35.97	2026-08-14 08:12:35.97
cmsso6wkg000xp901dwhu0evx	24642693-14f5-4d7c-ba8e-09bee7d029d2	0	888	0	7	2026-08-14 08:13:21.374	2026-07	2026-08-14 08:13:21.376	2026-08-14 08:13:21.376
cmsso78hi0011p901qqchvl0u	0f0ecb53-3b7d-4700-bcbb-3780ca41161e	0	850	0	41	2026-08-14 08:13:36.82	2026-07	2026-08-14 08:13:36.822	2026-08-14 08:13:36.822
cmsso7jtu0015p9015wdqjo92	9b34ef0e-44be-42e0-bf45-6139e305897f	0	809	0	18	2026-08-14 08:13:51.522	2026-07	2026-08-14 08:13:51.523	2026-08-14 08:13:51.523
cmssow2k0001dp9010lvlhfug	0f0ecb53-3b7d-4700-bcbb-3780ca41161e	850	1134	41	49	2026-08-14 08:32:55.535	2026-08	2026-08-14 08:32:55.536	2026-08-14 08:32:55.536
cmssp1tvt001hp901chkql4nw	238f3e4c-be34-4a6b-a2f5-a44d2da9f387	3158	3529	93	100	2026-08-14 08:37:24.231	2026-08	2026-08-14 08:37:24.233	2026-08-14 08:37:24.233
cmssp2mxx001lp9014lg6j4tg	028abfed-1b1c-4b12-9518-c273267a2469	3730	3762	94	97	2026-08-14 08:38:01.892	2026-08	2026-08-14 08:38:01.893	2026-08-14 08:38:01.893
cmssp339l001pp9011pk3wmpe	62e32efb-170c-4321-95aa-bf2284d44d4a	3890	4153	925	930	2026-08-14 08:38:23.047	2026-08	2026-08-14 08:38:23.049	2026-08-14 08:38:23.049
cmssp8jpl001tp901wkljz4pp	a5f1ec32-83ed-48a7-94e4-6f1c5c177849	5970	6065	620	623	2026-08-14 08:42:37.64	2026-08	2026-08-14 08:42:37.642	2026-08-14 08:42:37.642
cmssp9h9p001xp901zhj1375o	427beb24-4410-4562-8611-54410343da4b	2246	2439	274	297	2026-08-14 08:43:21.132	2026-08	2026-08-14 08:43:21.133	2026-08-14 08:43:21.133
cmsspcq0n0021p901ztoare6z	9b34ef0e-44be-42e0-bf45-6139e305897f	809	1147	18	22	2026-08-14 08:45:52.438	2026-08	2026-08-14 08:45:52.44	2026-08-14 08:45:52.44
cmssoutdu0019p90157w8hp8s	24642693-14f5-4d7c-ba8e-09bee7d029d2	888	1103	7	11	2026-08-14 08:48:55.789	2026-08	2026-08-14 08:31:56.994	2026-08-14 08:48:55.79
cmsspsggc002lp901wu652hhc	0f86e07b-0e05-46a0-89aa-af486a91a672	3455	3515	742	744	2026-08-14 08:58:06.539	2026-08	2026-08-14 08:58:06.54	2026-08-14 08:58:06.54
cmsspjued002dp901wnewontk	27d61e0c-6246-438a-8b0c-26b1c761a433	3052	3164	406	409	2026-08-14 08:51:24.708	2026-08	2026-08-14 08:51:24.709	2026-08-14 08:51:24.709
cmsso52vv000lp9012sh6dk1l	0f86e07b-0e05-46a0-89aa-af486a91a672	0	3455	0	742	2026-08-14 08:52:58.437	2026-07	2026-08-14 08:11:56.251	2026-08-14 08:52:58.438
cmsso2anv0005p901rmqccqln	b502bccb-d148-40bb-800e-6013245b2d07	0	3787	0	340	2026-08-16 10:58:46.645	2026-07	2026-08-14 08:09:46.363	2026-08-16 10:58:46.646
cmssszg3h0005p101hkaf3uab	167a9499-00d4-455e-85d6-e1863aad969b	0	1520	0	463	2026-08-14 10:27:31.516	2026-07	2026-08-14 10:27:31.518	2026-08-14 10:27:31.518
cmsst03680009p101pcbjts2e	167a9499-00d4-455e-85d6-e1863aad969b	1520	1722	463	470	2026-08-14 17:13:48.865	2026-08	2026-08-14 10:28:01.424	2026-08-14 17:13:48.866
cmsvp00hs000tp501z9etkwyq	b502bccb-d148-40bb-800e-6013245b2d07	3787	3952	340	350	2026-08-16 10:59:18.015	2026-08	2026-08-16 10:59:18.017	2026-08-16 10:59:18.017
cmssqfkim002pp9011vsyamr4	cmsslspk00000p901hsne9923	0	0	0	0	2026-08-19 06:39:08.096	2026-08	2026-08-14 09:16:04.894	2026-08-19 06:39:08.098
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: nhatro
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
4cc0104b-cfa4-44ec-9771-5dc365d50bdd	257b60ca14d7dd857ce8b799627fcc5d6d805603fb106eda4c183fc07cf6069a	2026-06-03 03:14:25.033358+00	20260603031424_init_schema	\N	\N	2026-06-03 03:14:24.965069+00	1
e0954dbd-b17d-48b6-b634-7e1ef2fb67d0	92582ee20d56737f878058a3a392bfa88208b8fd1129af4e3b5295bd8e348eab	2026-06-03 09:47:29.766407+00	20260603094729_add_utility_record_billing_day	\N	\N	2026-06-03 09:47:29.738826+00	1
18f76eda-8c11-4e01-a375-10f72874c8e0	0233661f97190df86136bb9c4e5ac2be9b52b1054636aa03b5ca6ca83a81a506	2026-08-10 04:32:51.837818+00	20260810040000_add_tenant_email		\N	2026-08-10 04:32:51.837818+00	0
998102f3-3866-41a1-acfe-00bfc6fe8e75	ac1aa3ee13185be5cd65613f7b2c22aef48379181fde0c81641c29d6ed38f701	\N	20260814080000_add_notification_log	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260814080000_add_notification_log\n\nDatabase error code: 42P07\n\nDatabase error:\nERROR: relation "NotificationLog" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \\"NotificationLog\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1164), routine: Some("heap_create_with_catalog") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260814080000_add_notification_log"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260814080000_add_notification_log"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:260	2026-08-19 01:54:10.667706+00	2026-08-19 01:53:18.079821+00	0
59335baf-2c5d-470b-a9c2-b03166247dea	ac1aa3ee13185be5cd65613f7b2c22aef48379181fde0c81641c29d6ed38f701	2026-08-19 01:54:10.672945+00	20260814080000_add_notification_log		\N	2026-08-19 01:54:10.672945+00	0
c577ff8a-1a8f-4e98-ba8b-875b165b300c	dcc6d40d03548d21b63f79b533c1f1a5d39a5de51e1af5924f4a9e31eb712366	2026-08-19 01:54:16.056731+00	20260819000000_notification_log_cascade_delete	\N	\N	2026-08-19 01:54:16.019138+00	1
\.


--
-- Name: Contract Contract_pkey; Type: CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: Landlord Landlord_pkey; Type: CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public."Landlord"
    ADD CONSTRAINT "Landlord_pkey" PRIMARY KEY (id);


--
-- Name: NotificationLog NotificationLog_pkey; Type: CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public."NotificationLog"
    ADD CONSTRAINT "NotificationLog_pkey" PRIMARY KEY (id);


--
-- Name: Room Room_pkey; Type: CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public."Room"
    ADD CONSTRAINT "Room_pkey" PRIMARY KEY (id);


--
-- Name: Tenant Tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public."Tenant"
    ADD CONSTRAINT "Tenant_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: UtilityRecord UtilityRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public."UtilityRecord"
    ADD CONSTRAINT "UtilityRecord_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Invoice_period_idx; Type: INDEX; Schema: public; Owner: nhatro
--

CREATE INDEX "Invoice_period_idx" ON public."Invoice" USING btree (period);


--
-- Name: Invoice_referenceCode_key; Type: INDEX; Schema: public; Owner: nhatro
--

CREATE UNIQUE INDEX "Invoice_referenceCode_key" ON public."Invoice" USING btree ("referenceCode");


--
-- Name: Invoice_status_idx; Type: INDEX; Schema: public; Owner: nhatro
--

CREATE INDEX "Invoice_status_idx" ON public."Invoice" USING btree (status);


--
-- Name: Landlord_userId_key; Type: INDEX; Schema: public; Owner: nhatro
--

CREATE UNIQUE INDEX "Landlord_userId_key" ON public."Landlord" USING btree ("userId");


--
-- Name: NotificationLog_invoiceId_idx; Type: INDEX; Schema: public; Owner: nhatro
--

CREATE INDEX "NotificationLog_invoiceId_idx" ON public."NotificationLog" USING btree ("invoiceId");


--
-- Name: Room_roomNumber_key; Type: INDEX; Schema: public; Owner: nhatro
--

CREATE UNIQUE INDEX "Room_roomNumber_key" ON public."Room" USING btree ("roomNumber");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: nhatro
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_roomId_key; Type: INDEX; Schema: public; Owner: nhatro
--

CREATE UNIQUE INDEX "User_roomId_key" ON public."User" USING btree ("roomId");


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: nhatro
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: UtilityRecord_billingMonth_idx; Type: INDEX; Schema: public; Owner: nhatro
--

CREATE INDEX "UtilityRecord_billingMonth_idx" ON public."UtilityRecord" USING btree ("billingMonth");


--
-- Name: UtilityRecord_roomId_billingMonth_key; Type: INDEX; Schema: public; Owner: nhatro
--

CREATE UNIQUE INDEX "UtilityRecord_roomId_billingMonth_key" ON public."UtilityRecord" USING btree ("roomId", "billingMonth");


--
-- Name: Contract Contract_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Contract Contract_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_contractId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES public."Contract"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Landlord Landlord_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public."Landlord"
    ADD CONSTRAINT "Landlord_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: NotificationLog NotificationLog_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public."NotificationLog"
    ADD CONSTRAINT "NotificationLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Room Room_landlordId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public."Room"
    ADD CONSTRAINT "Room_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES public."Landlord"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UtilityRecord UtilityRecord_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nhatro
--

ALTER TABLE ONLY public."UtilityRecord"
    ADD CONSTRAINT "UtilityRecord_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 9MFlRUYWjBBIgtR0VsQ88aRbiBqvlVozSK5dVqxSTZv6f4gIsnUDlaEsJ5OV8VV

