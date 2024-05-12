import { Jobs, Prisma } from '@prisma/client';
import pw, { Browser } from "playwright";
import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'
const SBR_CDP = `wss://${process.env.BRIGHT_DATA_AUTH}@brd.superproxy.io:9222`;
const SBR_CDP2 = `wss://${process.env.BRIGHT_DATA_AUTH2}@brd.superproxy.io:9222`;

export const GET = async (req: Request, res: Response) => {
    const browser = await pw.chromium.connectOverCDP(SBR_CDP);
    const browser2 = await pw.chromium.connectOverCDP(SBR_CDP2);

    const remoteOkJobs = await getRemoteOkJobs(browser);
    const weworkremotelyJobs = await getWeWorkRemotelyJobs(browser2);

    const prisma = new PrismaClient();
    const jobs = [...remoteOkJobs, ...weworkremotelyJobs];
    await prisma.jobs.createMany({
        data: jobs,
    });

    return NextResponse.json({
        jobs,
    });
};

const getWeWorkRemotelyJobs = async (instance: Browser) => {
    const page = await instance.newPage();
    await page.goto("https://weworkremotely.com/categories/remote-full-stack-programming-jobs#job-listings");

    const jobs = await page.$$eval('article li', (rows) => {
        return rows.map(row => {
            if (row.classList.contains('ad')) return;

            const obj = {
                title: '',
                company: '',
                date: new Date(),
                logo: '',
                salary: '',
                url: '',
                location: '',
            } satisfies Prisma.JobsCreateManyInput;

            const title = row.querySelector('.title');
            if (title) {
                obj.title = title.textContent?.trim() ?? "";
            }

            const divLogo = row.querySelector('.flag-logo') as HTMLDivElement;
            if (divLogo) {
                const backgroundImage = divLogo.style.backgroundImage;
                const img = backgroundImage?.replace('url(', '').replace(')', '').replaceAll('"', "");
                obj.logo = img;
            }

            const aElement = row.querySelectorAll('a')[0];
            if (aElement) {
                obj.url = "https://weworkremotely.com" + aElement.getAttribute('href') ?? "";
            }

            const company = row.querySelector('.company');
            if (company) {
                obj.company = company.textContent?.trim() ?? "";
            }

            return obj;
        })
    });

    const jobsFiltered = jobs.filter(job => {
        if (!job) return false;
        if (!job.title) return false;
        if (!job.url) return false;
        if (!job.company) return false;
        return true;
    }) as Prisma.JobsCreateManyInput[];

    return jobsFiltered;
}

const getRemoteOkJobs = async (instance: Browser) => {
    const page = await instance.newPage();
    await page.goto('https://remoteok.com/remote-engineer-jobs?order_by=date');

    const jobs = await page.$$eval('tbody > tr', (rows) => {
        return rows.map(row => {
            if (row.classList.contains('ad')) return;

            const obj = {
                title: '',
                company: '',
                date: new Date(),
                logo: '',
                salary: '',
                url: '',
                location: '',
            } satisfies Prisma.JobsCreateManyInput;

            const h2Title = row.querySelector('h2');
            if (h2Title) {
                obj.title = h2Title.textContent?.trim() ?? "";
            }

            const hasLogoElement = row.querySelector('.has-logo');
            if (hasLogoElement) {
                const img = hasLogoElement.querySelector('img');
                obj.logo = img?.getAttribute('src') ?? '';
            }

            const url = row.getAttribute('data-url');
            if (url) {
                obj.url = "https://remoteok.com" + url;
            }

            const h3Company = row.querySelector('h3');
            if (h3Company) {
                obj.company = h3Company.textContent?.trim() ?? "";
            }

            const locationsElement = row.querySelectorAll('.location');
            for (const locationElement of locationsElement) {
                const location = locationElement.textContent?.trim();
                if (location?.startsWith("💰")) {
                    obj.salary = location;
                } else {
                    obj.company += ` - ${location}`;
                    obj.location = location ?? '';
                }
            }

            return obj;
        })
    });

    const jobsFiltered = jobs.filter(job => {
        if (!job) return false;
        if (!job.title) return false;
        if (!job.url) return false;
        if (!job.company) return false;
        if (!job.salary) return false;
        return true;
    }) as Prisma.JobsCreateManyInput[];

    return jobsFiltered;
};