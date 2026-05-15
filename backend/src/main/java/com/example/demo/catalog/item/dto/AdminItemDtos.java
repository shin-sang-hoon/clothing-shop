package com.example.demo.catalog.item.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public class AdminItemDtos {

    public record ItemTag(
            Long id,
            String name
    ) {
    }

    public record ItemOptionValue(
            Long id,
            Long tagId,
            String name,
            Integer quantity,
            Integer sortOrder
    ) {
    }

    public record ItemOptionRequest(
            Long tagId,
            String optionValue,
            Integer quantity,
            Integer sortOrder
    ) {
    }

    public record ItemListResponse(
            Long id,
            String name,
            Long brandId,
            String brand,
            Long categoryId,
            String category,
            String kind,
            Integer retailPrice,
            Integer rentalPrice,
            String itemMode,
            Integer viewCnt,
            String status,
            String description,
            String img,
            List<String> subImgs,
            List<ItemTag> tags,
            List<ItemOptionValue> optionItems,
            String createdAt
    ) {
    }

    public record ItemDetailResponse(
            Long id,
            String name,
            Long brandId,
            String brand,
            Long categoryId,
            String category,
            String kind,
            Integer retailPrice,
            Integer rentalPrice,
            String itemMode,
            Integer viewCnt,
            String status,
            String description,
            String img,
            List<String> subImgs,
            List<ItemTag> tags,
            List<ItemOptionValue> optionItems,
            String createdAt
    ) {
    }

    public record CreateItemRequest(
            @NotBlank(message = "상품명을 입력해주세요.")
            @Size(max = 200, message = "상품명은 200자 이하로 입력해주세요.")
            String name,

            Long brandId,

            Long categoryId,

            String kind,

            Integer retailPrice,

            Integer rentalPrice,

            String itemMode,

            String status,

            String description,

            @Size(max = 500)
            String img,

            List<@Size(max = 500) String> subImgs,

            List<Long> attributeTagIds,

            List<ItemOptionRequest> optionItems
    ) {
    }

    public record UpdateItemRequest(
            @NotBlank(message = "상품명을 입력해주세요.")
            @Size(max = 200, message = "상품명은 200자 이하로 입력해주세요.")
            String name,

            Long brandId,

            Long categoryId,

            String kind,

            Integer retailPrice,

            Integer rentalPrice,

            String itemMode,

            String status,

            String description,

            @Size(max = 500)
            String img,

            List<@Size(max = 500) String> subImgs,

            List<Long> attributeTagIds,

            List<ItemOptionRequest> optionItems
    ) {
    }

    public record UpdateItemUseRequest(
            @NotNull(message = "사용 여부를 입력해주세요.")
            Boolean useYn
    ) {
    }
}
