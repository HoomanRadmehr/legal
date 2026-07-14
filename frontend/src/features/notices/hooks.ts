import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getCase, listCases } from "../cases/api";
import { getContract, listContracts } from "../contracts/api";
import { deadlineQueryKeys } from "../deadlines/queryKeys";
import {
  archiveNotice,
  createNotice,
  getNotice,
  listNotices,
  listNoticeTimeline,
  updateNotice,
} from "./api";
import { noticeQueryKeys } from "./queryKeys";
import type {
  NoticeInput,
  NoticeListParams,
  NoticeUpdateInput,
  RelatedMatterChoice,
  RelatedMatterLink,
} from "./types";

export function useNoticeList(params: NoticeListParams) {
  return useQuery({
    queryFn: () => listNotices(params),
    queryKey: noticeQueryKeys.list(params),
  });
}

export function useNoticeDetail(noticeId: string) {
  return useQuery({
    queryFn: () => getNotice(noticeId),
    queryKey: noticeQueryKeys.detail(noticeId),
  });
}

export function useNoticeTimeline(noticeId: string) {
  return useQuery({
    queryFn: () => listNoticeTimeline(noticeId),
    queryKey: noticeQueryKeys.timeline(noticeId),
  });
}

export function useRelatedMatterChoices(search: string) {
  return useQuery({
    queryFn: () => listRelatedMatterChoices(search),
    queryKey: noticeQueryKeys.relatedChoices(search),
  });
}

export function useRelatedMatterLinks(matterIds: string[]) {
  return useQuery({
    enabled: matterIds.length > 0,
    queryFn: () => listRelatedMatterLinks(matterIds),
    queryKey: noticeQueryKeys.relatedLinks(matterIds),
  });
}

export function useCreateNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NoticeInput) => createNotice(input),
    onSuccess: (createdNotice) => {
      queryClient.setQueryData(
        noticeQueryKeys.detail(createdNotice.id),
        createdNotice,
      );
      invalidateNoticeAndDeadlineQueries(queryClient);
    },
  });
}

export function useUpdateNotice(noticeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NoticeUpdateInput) => updateNotice(noticeId, input),
    onSuccess: (updatedNotice) => {
      queryClient.setQueryData(noticeQueryKeys.detail(noticeId), updatedNotice);
      invalidateNoticeAndDeadlineQueries(queryClient);
    },
  });
}

export function useArchiveNotice(noticeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (version: number) => archiveNotice(noticeId, version),
    onSuccess: (archivedNotice) => {
      queryClient.setQueryData(
        noticeQueryKeys.detail(noticeId),
        archivedNotice,
      );
      invalidateNoticeAndDeadlineQueries(queryClient);
    },
  });
}

export async function listRelatedMatterChoices(
  search: string,
): Promise<RelatedMatterChoice[]> {
  const [cases, contracts] = await Promise.all([
    listCases({ archived: false, search }),
    listContracts({ archived: false, search }),
  ]);
  return [
    ...cases.results.map((item) => ({
      id: item.id,
      kind: "case" as const,
      reference_code: item.reference_code,
      title: item.title,
    })),
    ...contracts.results.map((item) => ({
      id: item.id,
      kind: "contract" as const,
      reference_code: item.reference_code,
      title: item.title,
    })),
  ];
}

export async function listRelatedMatterLinks(
  matterIds: string[],
): Promise<RelatedMatterLink[]> {
  const resolvedLinks = await Promise.all(
    matterIds.map(resolveRelatedMatterLink),
  );
  return resolvedLinks.filter(
    (link): link is RelatedMatterLink => link !== null,
  );
}

async function resolveRelatedMatterLink(
  matterId: string,
): Promise<RelatedMatterLink | null> {
  const [caseResult, contractResult] = await Promise.allSettled([
    getCase(matterId),
    getContract(matterId),
  ]);

  if (caseResult.status === "fulfilled") {
    return {
      id: caseResult.value.id,
      kind: "case",
      reference_code: caseResult.value.reference_code,
      title: caseResult.value.title,
      to: `/cases/${caseResult.value.id}`,
    };
  }
  if (contractResult.status === "fulfilled") {
    return {
      id: contractResult.value.id,
      kind: "contract",
      reference_code: contractResult.value.reference_code,
      title: contractResult.value.title,
      to: `/contracts/${contractResult.value.id}`,
    };
  }
  return null;
}

function invalidateNoticeAndDeadlineQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: noticeQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: deadlineQueryKeys.all });
}
