package com.example.demo.catalog.mapping.dto;

import java.util.List;

public class ShopMappingDtos {

    public record DisplayFilter(
            Long id,
            String name,
            String code,
            String colorHex
    ) {
    }

    public record DisplayFilterGroup(
            Long filterGroupId,
            String filterGroupName,
            String filterGroupCode,
            List<DisplayFilter> filters
    ) {
    }

    public record DisplayTag(
            Long id,
            String name,
            String code
    ) {
    }

    public record CategoryDisplayMappingResponse(
            Long categoryId,
            String categoryName,
            String categoryCode,
            Long parentId,
            String parentCode,
            List<DisplayFilterGroup> filterGroups,
            List<DisplayTag> tags
    ) {
    }
}
