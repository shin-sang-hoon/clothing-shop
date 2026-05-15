package com.example.demo.catalog.item.dto;

import java.util.List;

public class HomeItemDtos {

    public record HomeItemListResponse(
            List<ItemDtos.ItemListResponse> items,
            String cacheSource
    ) {
    }
}
